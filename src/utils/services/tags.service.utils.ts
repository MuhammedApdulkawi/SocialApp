import { Types } from "mongoose";
import { BadRequestError } from "../Error/exceptions.utils";
import { isFriendService } from "./isFriend.service";

export const validateTags = async (
  _id: Types.ObjectId,
  tags: Types.ObjectId[],
) => {
  let uniqueTags: Types.ObjectId[] = [];
  if (tags && tags.length > 0) {
    // Check for duplicates before processing
    const originalLength = tags.length;
    uniqueTags = Array.from(new Set(tags));

    if (uniqueTags.length !== originalLength) {
      throw new BadRequestError("Duplicate tags detected");
    }

    // Check if user is tagging themselves
    if (uniqueTags.some((tag) => tag.toString() === _id.toString())) {
      throw new BadRequestError("You cannot tag yourself");
    }

    // Check if each tag is a valid friend
    const friendshipChecks = await Promise.all(
      uniqueTags.map((tag) => isFriendService(_id, tag)),
    );

    if (!friendshipChecks.every((isFriend) => isFriend)) {
      throw new BadRequestError(
        "Invalid Friends in tags - Can only tag your friends",
      );
    }
  }
  
  // Return the array of unique tags for further processing
  return uniqueTags; 
};