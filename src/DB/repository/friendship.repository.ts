import { IFriendship } from "../../common";
import { FriendshipModel } from "../models";
import { BaseRepository } from "./base.repository";

export class FriendshipRepository extends BaseRepository<IFriendship> {
  constructor() {
    super(FriendshipModel);
  }
}