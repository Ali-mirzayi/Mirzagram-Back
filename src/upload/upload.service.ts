import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from 'src/schemas/Message.schema';

type file = {
  id: string,
  path: string,
  mimetype: string,
  size: number
}

@Injectable()
export class UploadService {
  constructor(@InjectModel(Message.name) private messageModel: Model<Message>) { }
  private files: file[] = [];

  getFiles() {
    return this.files;
  };

  getFile(id: string) {
    return this.files.find(e => e?.id === id);
  };

  setFile(file: file) {
    const existUser = this.files?.find(e => e.id === file.id);
    if (existUser) return;
    this.files.push(file);
  };

  deleteFile(id: string) {
    this.files = this.files?.filter(file => file.id !== id);
  };
  
  async getMessages(){
    const rawModel = await this.messageModel.find({}, { _id: 0, __v: 0 });
    return rawModel;
  };

  async getMessage(){
    const rawModel = await this.messageModel.findOne({uuid:"oooooooolll"}, { _id: 0, __v: 0 }); 
    return rawModel;
  };
};
