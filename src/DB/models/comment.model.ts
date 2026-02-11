import mongoose from "mongoose";
import { IComment } from "../../common";

const commentSchema = new mongoose.Schema<IComment>({
    content:String,
    attachment:String,
    ownerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    refId:{
        type:mongoose.Schema.Types.ObjectId,
        refPath:"refType",
        required:true,
    },
    refType:{
        type:String,
        enum:["Post","Comment"],
        required:true,
    },
    tags:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
        }
    ]
}, { timestamps: true })

export const CommentModel = mongoose.model<IComment>("Comment", commentSchema);