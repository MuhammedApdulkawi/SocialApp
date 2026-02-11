import mongoose, { PaginateModel } from "mongoose";
import { IPost, POST_PRIVACY } from "../../common";
import mongoosePaginate from "mongoose-paginate-v2";

const postSchema = new mongoose.Schema<IPost>({
  description: String,
  attachments: [String],
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  allowComments: {
    type: Boolean,
    default: true,
  },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  privacy: {
    type: String,
    enum: Object.values(POST_PRIVACY),
    default: POST_PRIVACY.PUBLIC,
  }
}, { timestamps: true });

postSchema.plugin(mongoosePaginate);
export const PostModel = mongoose.model<IPost,PaginateModel<IPost>>("Post", postSchema);
