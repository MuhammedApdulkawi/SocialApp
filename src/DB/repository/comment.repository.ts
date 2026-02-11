import { IComment } from "../../common";
import { CommentModel } from "../models/comment.model";
import { BaseRepository } from "./base.repository";

export class CommentRepository extends BaseRepository<IComment>{
    constructor() {
        super(CommentModel);
    }
}