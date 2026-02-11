import { Document, Types } from "mongoose";

export interface IPost extends Document <Types.ObjectId> {
    description: string;
    attachments: string[];
    ownerId: Types.ObjectId;
    allowComments: boolean;
    tags: Types.ObjectId[];
    privacy: string;
    comments: Types.ObjectId[];
}