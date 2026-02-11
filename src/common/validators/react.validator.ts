import z from "zod";
import { isValidObjectId } from "mongoose";
import { REACT_TYPE } from "../enum/enums";

/**
 * Common validation schemas
 */
const objectIdSchema = z
  .string()
  .refine((id) => isValidObjectId(id), "Invalid ObjectId");

/**
 * React Validators
 */
const reactValidator = {
  body: z.object({
    postId: objectIdSchema,
    userId: objectIdSchema,
    type: z.enum(REACT_TYPE),
  }),
};

export const createReactValidator = {
  body: reactValidator.body.pick({ postId: true, type: true }),
};

export const getPostReactsValidator = {
  params: reactValidator.body.pick({ postId: true }),
};
