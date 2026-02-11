import { Document, Types } from "mongoose";

export interface IReact extends Document <Types.ObjectId> {
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    type: "like" | "dislike";
}