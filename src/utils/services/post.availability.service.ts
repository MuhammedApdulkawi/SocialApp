import { IPost, IUser, POST_PRIVACY } from "../../common";
import { BadRequestError } from "../Error/exceptions.utils";
import { isFriendService } from "./isFriend.service";

export const postAvailability = async (post: IPost, user: IUser) => {
    
  if (post.privacy === POST_PRIVACY.PUBLIC) {
    return true;
  }
  if (post.privacy === POST_PRIVACY.FRIENDS) {
    if(await isFriendService(user._id, post.ownerId) || post.tags.includes(user._id)){
        return true;
    }else{
        throw new BadRequestError(
            "Invalid Post Privacy Setting - Only Friends Can View This Post",
          );
    }
  }
  if (post.privacy === POST_PRIVACY.ONLY_ME) {
    if ( post.ownerId.equals(user._id) || post.tags.includes(user._id) ){
      return true;
    } else {
      throw new BadRequestError(
        "Invalid Post Privacy Setting -Only The Owner Can View This Post",
      );
    }
  }
};
