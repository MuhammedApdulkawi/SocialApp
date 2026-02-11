import { IMessage } from "../../common";
import { MessageModel } from "../models";
import { BaseRepository } from "./base.repository";

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(MessageModel);
  }
}
