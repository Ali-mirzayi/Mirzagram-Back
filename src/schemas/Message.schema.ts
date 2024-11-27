import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum availableStatus {
    "available" = 0,
    "downloading" = 1,
    "download" = 2,
    "uploading" = 3,
    "error" = 4,
    "cancel" = 5,
};

export type replyMessage = { _id: string | number, name?: string, text?: string, image?: string, fileName?: string, musicName?: string, thumbnail?: string, preView?: string, video?: string, mimeType?: string } | undefined;

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
    @Prop({ required: true })
    roomId: string;

    @Prop({ unique: true, required: true })
    uuid: string;

    @Prop({ required: false })
    text: string;

    @Prop({ required: true })
    createdAt: Date;

    @Prop({
        required: true, type: {
            _id: { type: String, require: true },
            name: { type: String, require: true },
            avatar: { type: String, require: true },
            token: { type: String, require: false }
        }
    })
    user: {
        _id: string;
        name: string;
        avatar: string;
        token?: string;
    };

    @Prop({ required: false })
    image?: string;

    @Prop({ required: false })
    video?: string;

    @Prop({ required: false })
    audio?: string;

    @Prop({ required: false })
    sent?: boolean;

    @Prop({ required: false })
    received?: boolean;

    @Prop({ required: false })
    pending?: boolean;

    @Prop({ required: false })
    fileName?: string;

    @Prop({ required: false })
    file?: string;

    @Prop({ required: false })
    mimeType?: string;

    @Prop({ required: false })
    preView?: string;

    @Prop({ required: false })
    thumbnail?: string;

    @Prop({ required: false })
    duration?: number;

    @Prop({ required: false })
    size?: string;

    @Prop({
        required: false,
        type: {
            _id: { type: String, require: true },
            name: { type: String, require: false },
            text: { type: String, require: false },
            image: { type: String, require: false },
            fileName: { type: String, require: false },
            musicName: { type: String, require: false },
            thumbnail: { type: String, require: false },
            preView: { type: String, require: false },
            video: { type: String, require: false },
            mimeType: { type: String, require: false }
        }
    })
    reply?: {
        _id: string,
        name?: string,
        text?: string,
        image?: string,
        fileName?: string,
        musicName?: string,
        thumbnail?: string,
        preView?: string,
        video?: string,
        mimeType?: string
    };
};

export const MessageSchema = SchemaFactory.createForClass(Message);