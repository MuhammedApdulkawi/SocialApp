import mongoose from "mongoose";
import { FRIENDSHIP_STATUS, IFriendship } from "../../common";

const FriendshipSchema = new mongoose.Schema<IFriendship>({
  requestFromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  requestToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: Object.values(FRIENDSHIP_STATUS),
    default: FRIENDSHIP_STATUS.PENDING,
  },
}, { timestamps: true });


export const FriendshipModel = mongoose.model<IFriendship>(
  "Friendship",
  FriendshipSchema,
);
