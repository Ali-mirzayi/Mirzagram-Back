import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RoomsService, RoomType } from './container/rooms/rooms.service';
import { UsersService, UserType } from './container/users/users.service';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import { Expo } from 'expo-server-sdk';

type updateUserType = { user: UserType; cleanRoom: RoomType[] };
type notificationType = { name:string, message:string, token:string, roomId:string };

@Injectable()
export class AppService {
  constructor(
    private readonly users: UsersService,
    private readonly chatRooms: RoomsService,
  ) {}

  handleUpdateUser(body: updateUserType) {
    const { user, cleanRoom } = body;
    try {
      const isUserExist = this.users.getUser(user._id);
      const rooms = this.chatRooms.getAll();
      if (isUserExist === undefined) {
        this.users.setDangeresUser(user);
        if (cleanRoom?.length === 0) return;
        const remainingRooms = cleanRoom.filter((e) => {
          !rooms.some((room) => room.id === e.id);
        });
        this.chatRooms.setRooms([...rooms, ...remainingRooms]);
      } else {
        this.users.updateUsers(user);
      }
    } catch (err) {
      console.log(`error to update ${err}`);
    }
  }

  async sendNotification(body:notificationType){
    const expo = new Expo();
    const { name, message, token } = body;

    if (!Expo.isExpoPushToken(token)) {
      throw new HttpException(`Push token ${token} is not a valid Expo push token`,HttpStatus.FORBIDDEN);
    }
    try {
      let ticket = await expo.sendPushNotificationsAsync([{
        to: token,
        title: name,
        body: message,
        ttl: 172800, //2d
        priority: "high",
      }]);
      return { status: ticket[0].status };
    } catch (err) {
      throw new HttpException(`Error NetWork error (no notif) ${err}`,HttpStatus.BAD_REQUEST);
    }
  };

  @Cron('0 0 * * *')
  handleCron() {
    const directory = 'uploads/';
    console.log('midnight is come');
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        const filePath = directory + file;
        const stat = fs.statSync(filePath);
        const now = new Date();
        const fileModifiedTime = new Date(stat.mtime);

        if (now.getTime() - fileModifiedTime.getTime() > 86400000) {
          fs.unlink(filePath, (err) => {
            if (err) throw err;
            console.log(`Deleted ${filePath}`);
          });
        }
      }
    });
  }
}
