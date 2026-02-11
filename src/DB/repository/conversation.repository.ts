import { IConversation } from "../../common";
import { ConversationModel } from "../models";
import { BaseRepository } from "./base.repository";

export class ConversationRepository extends BaseRepository<IConversation> {
  constructor() {
    super(ConversationModel);
  }
}
