import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { Server, Socket } from 'socket.io';
import { UsersService, UserType } from 'src/container/users/users.service';
import { generateID } from "src/utils/generateID";
import { OnlineUsersService } from './../container/onlineUsers/onlineUsers.service';
import { RoomsService, RoomType } from './../container/rooms/rooms.service';
import { UploadService } from './../upload/upload.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/Message.schema';
import sleep from 'src/utils/sleep';

ffmpeg.setFfmpegPath(ffmpegPath);

type findUserType = {
    user: UserType,
    search: string
};

@WebSocketGateway({ maxHttpBufferSize: 1e8, cors: { origin: "*", methods: ["GET", "POST"] } })
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        private readonly chatRooms: RoomsService,
        private readonly uploadFile: UploadService,
        private readonly users: UsersService,
        private readonly onlineUsers: OnlineUsersService
    ) { }

    @WebSocketServer() io: Server;

    handleConnection(socket: Socket) {
        console.log(`⚡: ${socket.id} user just connected!`);
        if(process.env.SOCKET_PASS){
            if(socket.handshake.auth.token !== process.env.SOCKET_PASS){
                console.log('wrong token for socket pass');
                socket.disconnect();
                return;
            }
        };
        socket.emit("connected");
    };

    @SubscribeMessage('joinInRoom')
    joinInRoom(socket: Socket, roomId: string) {
        socket.join(this.chatRooms.getById(roomId)?.id);
    };

    @SubscribeMessage('joinInRooms')
    joinInRooms(socket: Socket, userId: string) {
        let result = this.chatRooms.deleteRoomByUserID(userId);
        result.forEach(e => {
            socket.join(e.id);
        });
    };

    @SubscribeMessage('sendMessage')
    sendMessage(socket: Socket, data: any) {
        const [{ isIntractDB, ...message }] = data;
        if (isIntractDB) {
            const prepareData = {
                uuid: message._id,
                ...message
            };
            delete prepareData._id;
            const newMessage = new this.messageModel(prepareData);
            newMessage.save();
        };
        socket.to(message.roomId).emit('chatNewMessage', message);
    };

    @SubscribeMessage('sendImage')
    sendImage(socket: Socket, [{ roomId, isIntractDB, ...newMessage }]: any) {
        const {path:fileName, size} = this.uploadFile.getFile(newMessage?._id);
        const filePath = `uploads/${fileName}`;
        if (!filePath) return;
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error("Error reading image", err);
            };
            sharp(data).jpeg({ quality: 4 }).toBuffer()
                .then(reducedData => {
                    const base64Data = Buffer.from(reducedData).toString('base64');
                    const message = { ...newMessage, image: fileName, preView: base64Data, roomId, size };
                    if (isIntractDB) {
                        const prepareData = {
                            uuid: message._id,
                            ...message
                        };
                        delete prepareData._id;
                        const newMessageModel = new this.messageModel(prepareData);
                        newMessageModel.save();
                    };
                    socket.to(roomId).emit('chatNewMessage', message);
                }).catch(err => {
                    const message = { ...newMessage, image: fileName, preView: undefined, roomId, size };
                    if (isIntractDB) {
                        const prepareData = {
                            uuid: message._id,
                            ...message
                        };
                        delete prepareData._id;
                        const newMessageModel = new this.messageModel(prepareData);
                        newMessageModel.save();
                    };
                    console.error("Error sharp image", err);
                    socket.to(roomId).emit('chatNewMessage', message);
                }).finally(()=>{
                    this.uploadFile.deleteFile(newMessage?._id)
                });
        });
    };

    @SubscribeMessage('sendVideo')
    sendVideo(socket: Socket, [{ roomId, isIntractDB, ...newMessage }]: any) {
        const {path:fileName, size} = this.uploadFile.getFile(newMessage?._id);
        const video = `uploads/${fileName}`;
        const thumbName = `${Date.now()}.jpg`;
        if (!video) return;
        try {
            ffmpeg({
                source: video,
            }).on('end', () => {
                sharp(`uploads/${thumbName}`).jpeg({ quality: 5 }).toBuffer()
                    .then(reducedData => {
                        const base64Data = Buffer.from(reducedData).toString('base64');
                        const message = { ...newMessage, video: fileName, thumbnail: base64Data, roomId, size };
                        if (isIntractDB) {
                            const prepareData = {
                                uuid: message._id,
                                ...message
                            };
                            delete prepareData._id;
                            const newMessageModel = new this.messageModel(prepareData);
                            newMessageModel.save();
                        };
                        socket.to(roomId).emit('chatNewMessage', message);
                        console.log('thumbnail,', video, 'video sended');
                    }).catch(err => {
                        const message = { ...newMessage, video: fileName, roomId, size};
                        if (isIntractDB) {
                            const prepareData = {
                                uuid: message._id,
                                ...message
                            };
                            delete prepareData._id;
                            const newMessageModel = new this.messageModel(prepareData);
                            newMessageModel.save();
                        };
                        socket.to(roomId).emit('chatNewMessage', message);
                        console.error(err, 'error creating base64 thumbnail');
                    });
            }).on('error', (err) => {
                const message = { ...newMessage, video: fileName, roomId, size };
                if (isIntractDB) {
                    const prepareData = {
                        uuid: message._id,
                        ...message
                    };
                    delete prepareData._id;
                    const newMessageModel = new this.messageModel(prepareData);
                    newMessageModel.save();
                };
                socket.to(roomId).emit('chatNewMessage', message);
                console.error(err, 'error creating thumbnail');
            }).takeScreenshots({
                filename: thumbName,
                // timestamps: ['20%'],
                folder: "uploads/",
                timemarks: [2]
            });
        } catch (e) {
            console.log(e, 'error send thumbnail')
        }
        this.uploadFile.deleteFile(newMessage?._id);
    };

    @SubscribeMessage('sendFile')
    sendFile(socket: Socket, [{ roomId, isIntractDB, ...newMessage }]: any) {
        console.log({ roomId, isIntractDB, ...newMessage },'file');
        console.log(this.uploadFile.getFiles(),'uploadFile');
        const { path, mimetype, size } = this.uploadFile.getFile(newMessage?._id);
        if (!!path) {
            console.log('downloading file finished ...');
            const message = { ...newMessage, file: path, mimeType: mimetype, roomId, size };
            if (isIntractDB) {
                const prepareData = {
                    uuid: message._id,
                    ...message
                };
                delete prepareData._id;
                const newMessageModel = new this.messageModel(prepareData);
                newMessageModel.save();
            };
            socket.to(roomId).emit('chatNewMessage', message);
        } else {
            console.log('Upload not finished yet');
        };

        this.uploadFile.deleteFile(newMessage?._id);
    };

    @SubscribeMessage('sendAudio')
    sendAudio(socket: Socket, [{ roomId, isIntractDB, ...newMessage }]: any) {
        console.log('sendAudio')
        const {path: audio, size} = this.uploadFile.getFile(newMessage?._id);

        if (!!audio) {
            console.log('downloading file finished ...');
            const message = { ...newMessage, audio, roomId, size };
            if (isIntractDB) {
                const prepareData = {
                    uuid: message._id,
                    ...message
                };
                delete prepareData._id;
                const newMessageModel = new this.messageModel(prepareData);
                newMessageModel.save();
            };
            socket.to(roomId).emit('chatNewMessage', message);
        } else {
            console.log('Upload not finished yet');
        };

        this.uploadFile.deleteFile(newMessage?._id);

    };

    @SubscribeMessage('recivedMessage')
    async recivedMessage(@MessageBody() { messageId, roomId, contact, userId }: { messageId: string, roomId: string, contact: UserType, userId: string }) {
        // contactSocketId should be true to emit recivedMessage and back to self
        const contactSocketId = this.onlineUsers?.findOnlineUserById(userId)?.socketId;
        this.io.to(contactSocketId).emit('recivedMessageResponse', { messageId, contact, roomId });
        // should messageModel modify recived to true
        await this.messageModel.findOneAndDelete({ uuid: messageId });
    };

    @SubscribeMessage('findUser')
    findUser(socket: Socket, data: findUserType) {
        // fix no need full user
        const { user, search } = data;
        let result = this.users.searchFindUser({ search, excludeName: user.name });
        socket.emit('findUser', result);
    };

    @SubscribeMessage('findRoom')
    findRoom(socket: Socket, data: { user: UserType, contact: UserType }) {
        const { user, contact } = data;
        const rooms = this.chatRooms.getAll();
        const result = rooms.find(e => e.users[0]._id === user._id && e.users[1]._id === contact._id || e.users[0]._id === contact._id && e.users[1]._id === user._id);

        if (result?.id) {
            socket.emit("createRoomResponse", { newRoom: result, contact });
            return;
        };

        if (!!result) {
            return;
        };

        const id = generateID();
        const newRoom = { id: id, users: [user, contact], messages: [] };
        this.chatRooms.setRoomDangerously(newRoom);
        socket.join(id);

        const contactSocket = this.onlineUsers.findOnlineUserById(contact._id)?.socket;

        if (contactSocket) {
            contactSocket.join(id);
        };

        socket.emit("createRoomResponse", { newRoom, contact });
    };

    @SubscribeMessage('setSocketId')
    setSocketId(socket: Socket, userId: string) {
        this.onlineUsers.setOnlineUser({ 'socketId': socket.id, 'socket': socket, 'userId': userId[0], 'userRoomId': undefined });
        // fix this unnasasary
        this.io.emit('userConnected', this.onlineUsers.getAllUserId());
    };

    @SubscribeMessage('setUserConnected')
    async setUserConnected(socket: Socket, { userId, cleanRoom }: { userId: string, cleanRoom: RoomType[] }) {
        const rooms = this.chatRooms.getAll();
        const remainingRooms = cleanRoom.filter(newRoom =>
            !rooms.some(room => room.id === newRoom.id)
        );
        this.chatRooms.setRooms([...rooms, ...remainingRooms]);
        this.onlineUsers.setOnlineUser({ 'socketId': socket.id, 'socket': socket, 'userId': userId, 'userRoomId': undefined });
        // fix this unnasasary
        this.io.emit('userConnected', this.onlineUsers.getAllUserId());
        const roomIds = cleanRoom.map(e => e.id);
        roomIds.forEach(e => {
            socket.join(e);
        });
        const rawModel = await this.messageModel.find({ roomId: { $in: roomIds } }, { _id: 0, __v: 0 }).lean();
        
        for (let i = 0; i < rawModel.length; i++) {
            if( rawModel[i].user._id !== userId ){
                socket.emit('chatNewMessage', rawModel[i]);
                await sleep(1000);
            };
        };
    };

    @SubscribeMessage('isUserInRoom')
    isUserInRoom(socket: Socket, { userId, contactId, userRoomId }: { userId: string, contactId: string, userRoomId: string }) {
        this.onlineUsers.updateUserRoomId({ userId, userRoomId });
        const userStatus = this.onlineUsers.findOnlineUserById(userId);
        const contactStatus = this.onlineUsers.findOnlineUserById(contactId);
        // fix this can just emit in room
        this.io.to(contactStatus?.socketId).to(socket.id).emit("isUserInRoomResponse", userStatus?.userRoomId === contactStatus?.userRoomId);
    };

    @SubscribeMessage('checkStatus')
    checkStatus(socket: Socket, { contactId, userRoomId }: { contactId: string, userRoomId: string }) {
        const contactStatus = this.onlineUsers.findOnlineUserById(contactId);
        const isInRoom = contactStatus?.userRoomId === userRoomId;
        socket.emit("checkStatusResponse", { 'status': !!contactStatus?.socketId, 'isInRoom': isInRoom });
    };

    handleDisconnect(socket: Socket) {
        this.onlineUsers.deleteUserBySocketId(socket.id);
        // this could be better
        this.io.emit('userDisconnected', this.onlineUsers.getAllUserId());
        console.log(`🔥: ${socket.id} user disconnected`);
    };
};