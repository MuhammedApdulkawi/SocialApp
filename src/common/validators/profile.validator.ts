import z from "zod";
import { isValidObjectId } from "mongoose";
import { userValidator } from "./user.validator";
import { KEY_TYPE } from "../enum/enums";

/**
 * Common validation schemas
 */
const objectIdSchema = z
  .string()
  .refine((id) => isValidObjectId(id), "Invalid ObjectId");

/**
 * User Profile Validators
 */
export const getProfileValidator = {
  params: z.object({
    userId: objectIdSchema,
  }),
};
export const updateProfileValidator = {
  body: userValidator.body.partial()
};

export const blockUserValidator = {
  body: z.object({
    blockUserId: objectIdSchema,
  }),
};

export const unBlockUserValidator = {
  body: z.object({
    unblockUserId: objectIdSchema,
  }),
};

export const resendOTPValidator = {
  body: userValidator.body.pick({ email: true }),
};

export const changeEmailValidator = {
  body: userValidator.body.pick({ email: true }).extend({
    inputOTP: userValidator.body.shape.otp,
  }),
};

export const renewSignedUrlValidator = {
  query: z.object({
    key: z.string("key must be a string").min(1, "Key is required"),
    keyType: z.nativeEnum(KEY_TYPE,"Invalid key type" ),
    }),
  }

export const createGroupValidator = {
  body: z.object({
    name: z.string("Group name must be a string").min(1, "Group name is required"),
    membersIds: z
      .array(objectIdSchema)
      .min(2, "At least two members are required"),
  }),
};

export const searchUserValidator = {
  query: z.object({
    name: z.string("Name must be a string").min(1, "Name is required for search"),
  }),
};
