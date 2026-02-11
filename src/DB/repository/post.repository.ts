import { FilterQuery, PaginateOptions } from "mongoose";
import { IPost } from "../../common";
import { BaseRepository } from "./base.repository";
import { PostModel } from "../models/post.model";

export class postRepository extends BaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }
  async paginatePosts(filter?: FilterQuery<IPost>, options?: PaginateOptions) {
    return PostModel.paginate(filter, options);
  }
}
