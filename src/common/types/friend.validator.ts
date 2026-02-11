import z from "zod";
import { listFriendsValidator, respondFriendValidator, sendOrRemoveFriendValidator } from "../validators";

export type respondFriendValidatorType = z.infer<typeof respondFriendValidator.body>;

export type sendOrRemoveFriendValidatorType = z.infer<typeof sendOrRemoveFriendValidator.body>;

export type listFriendsValidatorType = z.infer<typeof listFriendsValidator.body>;

