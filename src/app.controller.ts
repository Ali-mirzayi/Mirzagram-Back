import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { Body, Controller, Get, Post } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as sharp from 'sharp';
import { AppService } from './app.service';
import { RoomsService, RoomType } from './container/rooms/rooms.service';
import { UsersService, UserType } from './container/users/users.service';

ffmpeg.setFfmpegPath(ffmpegPath);
type updateUserType = { user: UserType, cleanRoom: RoomType[] };
type notificationType = { name:string, message:string, token:string, roomId:string };

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly users: UsersService,
    private readonly chatRooms: RoomsService,
  ) { };

  @Get()
  welcome(): string {
    return 'welcome version 1.5.5 mirzagram';
  };

  @Post('checkUserToAdd')
  checkUserToAdd(@Body() user: UserType) {
    const ppp = this.users.findUserByName(user.name);
    if (!!ppp) {
      return { isOK: false }
    } else {
      this.users.setDangeresUser(user);
      return { isOK: true };
    }
  };

  @Post('deleteUser')
  deleteUser(@Body() user: UserType) {
    const userId = user?._id;
    if(!userId) return;
    this.users.deleteUser(userId);
    this.chatRooms.deleteRoomByUserID(userId);
  };

  @Post('updateUser')
  updateUser(@Body() body: updateUserType) {
    this.appService.handleUpdateUser(body);
  };

  @Post('sendPushNotifications')
  sendPushNotifications(@Body() body:notificationType ){
    return this.appService.sendNotification(body);
  };
}
