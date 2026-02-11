import { Document, Types } from "mongoose";

export interface IComment extends Document<Types.ObjectId> {
    content: string;
    attachment: string;
    ownerId: Types.ObjectId;
    refId: Types.ObjectId;
    refType: "Post" | "Comment";
    tags: Types.ObjectId[];
}