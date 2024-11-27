import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/schemas/Message.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{
      name:Message.name,
      schema:MessageSchema
    }])
  ],
  controllers: [UploadController,
  ],
  providers: [UploadService],
  exports: [UploadService]
})
export class UploadModule {}
