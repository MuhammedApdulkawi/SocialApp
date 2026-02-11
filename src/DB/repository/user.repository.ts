import { Model } from "mongoose";
import { IUser } from "../../common";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<IUser>{
    constructor(protected _userModel: Model<IUser>) {
        super(_userModel);
    }
}