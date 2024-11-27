import { Injectable } from '@nestjs/common';
import { UserType } from '../users/users.service';

export type RoomType = {
    id: string,
    users: UserType[],
    messages: any[]
};

@Injectable()
export class RoomsService {
    private chatRooms: RoomType[] = [];

    getAll() {
        return this.chatRooms;
    };

    getById(id: string) {
        return this.chatRooms?.find(room => room.id === id);
    };

    setRooms(rooms: RoomType[]) {
        this.chatRooms = rooms;
    };

    setRoom(room: RoomType) {
        const existRoom = this.chatRooms?.find(e => e.id === room.id);
        if (existRoom) {
            this.chatRooms = this.chatRooms.map(e => {
                if (e.id === existRoom.id) {
                    return room
                } else {
                    return e
                }
            })
        } else {
            this.chatRooms.push(room);
        };
    };

    setRoomDangerously(room: RoomType) {
        this.chatRooms.unshift(room)
    };

    handleremainingRooms(roomId: string) {
        !this.chatRooms.some(chatRoom => chatRoom.id === roomId)
    };

    deleteRoomByUserID(userId: string) {
        return this.chatRooms.filter(e => e.users[0]._id !== userId || e.users[1]._id !== userId)
    };
};
