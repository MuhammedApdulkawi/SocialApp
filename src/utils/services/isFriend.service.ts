import { Types } from "mongoose";
import { FRIENDSHIP_STATUS, IUser } from "../../common";
import { FriendshipRepository } from "../../DB/repository";

export const isFriendService = async (
  user_id: Types.ObjectId,
  loggedInUser_id: Types.ObjectId,
) => {
  const friendshipRepo: FriendshipRepository = new FriendshipRepository();
  const friendships = await friendshipRepo.findOneDocument({
    $or: [
      { requestFromId: user_id, requestToId: loggedInUser_id },
      { requestToId: user_id, requestFromId: loggedInUser_id },
    ],
    status: FRIENDSHIP_STATUS.ACCEPTED,
  });
  if (!friendships) return false;
  return true;
};
