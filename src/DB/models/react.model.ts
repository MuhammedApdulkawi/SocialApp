import mongoose from "mongoose";
import { IReact, REACT_TYPE } from "../../common";

const reactSchema = new mongoose.Schema<IReact>({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: Object.values(REACT_TYPE),
    required: true,
  },
}, { timestamps: true });

export const ReactModel = mongoose.model<IReact>("React", reactSchema);
