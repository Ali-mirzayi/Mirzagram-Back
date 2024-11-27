import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { RoomsModule } from './container/rooms/rooms.module';
import { OnlineUsersModule } from './container/onlineUsers/onlineUsers.module';
import { UsersModule } from './container/users/users.module';
import { UploadModule } from './upload/upload.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DB_CONNECTOR),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    SocketModule,
    RoomsModule,
    UsersModule,
    OnlineUsersModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
