import z from "zod";
import { isValidObjectId } from "mongoose";
import { FRIENDSHIP_STATUS } from "../enum/enums";

/**
 * Common validation schemas
 */
const objectIdSchema = z
  .string()
  .refine((id) => isValidObjectId(id), "Invalid ObjectId");

/**
 * Friendship Validators
 */
const friendValidator = {
  body: z.object({
    requestFromId: objectIdSchema,
    requestToId: objectIdSchema,
    status: z.enum(Object.values(FRIENDSHIP_STATUS)),
  }),
};

export const respondFriendValidator = {
  body: friendValidator.body.pick({ requestFromId: true, status: true }),
};

export const sendOrRemoveFriendValidator = {
  body: friendValidator.body.pick({ requestToId: true }),
};

export const listFriendsValidator = {
  body: friendValidator.body.pick({ status: true }),
};
