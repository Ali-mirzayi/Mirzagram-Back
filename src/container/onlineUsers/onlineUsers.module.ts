import { Module } from '@nestjs/common';
import { OnlineUsersService } from './onlineUsers.service';

@Module({
    providers: [OnlineUsersService],
    exports: [OnlineUsersService]
})
export class OnlineUsersModule {}
