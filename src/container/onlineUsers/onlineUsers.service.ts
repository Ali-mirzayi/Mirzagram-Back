import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

export type onlineUsersType = {
    'socketId': string,
    'socket': Socket,
    'userId': string,
    'userRoomId': string
};

@Injectable()
export class OnlineUsersService {
    private onlineUsers: onlineUsersType[] = [];

    getAll() {
        return this.onlineUsers;
    };

    getByUserId(userId: string) {
        return this.onlineUsers?.find(room => room.userId === userId);
    };

    getAllUserId(){
        return this.onlineUsers.map(e => e.userId)
    };

    setOnlineUsers(onlineUsers: onlineUsersType[]) {
        this.onlineUsers = onlineUsers;
    };

    setOnlineUser(onlineUser: onlineUsersType) {
        const existOnlineUser = this.onlineUsers?.find(e => e.userId === onlineUser.userId);
        if (existOnlineUser) {
            this.onlineUsers = this.onlineUsers.map(e => {
                if (e.userId === existOnlineUser.userId) {
                    return onlineUser
                } else {
                    return e
                }
            })
        } else {
            this.onlineUsers.push(onlineUser);
        };
    };

    updateUserRoomId({ userId, userRoomId }: { userId: string, userRoomId: string }) {
        this.onlineUsers = this.onlineUsers.map((user) => {
            if (user.userId === userId) {
                return { ...user, userRoomId };
            } else {
                return user;
            }
        });
    };

    findOnlineUserById(id: string) {
        return this.onlineUsers.find(user => user.userId === id)
    };

    deleteUserBySocketId(socketId: string){
        this.onlineUsers = this.onlineUsers.filter(e => e.socketId !== socketId);
    };
}
