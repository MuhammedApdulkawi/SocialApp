import { Model } from "mongoose";
import { IBlacklistedToken } from "../../common";
import { BaseRepository } from "./base.repository";

export class BlacklistRepository extends BaseRepository<IBlacklistedToken>{
    constructor(protected _blacklistModel: Model<IBlacklistedToken>) {
        super(_blacklistModel);
    }
}