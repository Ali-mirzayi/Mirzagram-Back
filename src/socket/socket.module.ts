import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { UploadModule } from 'src/upload/upload.module';
import { RoomsModule } from 'src/container/rooms/rooms.module';
import { UsersModule } from 'src/container/users/users.module';
import { OnlineUsersModule } from 'src/container/onlineUsers/onlineUsers.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schemas/Message.schema';

@Module({
  imports: [
    UploadModule,
    RoomsModule,
    UsersModule,
    OnlineUsersModule,
    MongooseModule.forFeature([{
      name: Message.name,
      schema: MessageSchema
    }]),
  ],
  providers: [SocketService]
})
export class SocketModule { }
