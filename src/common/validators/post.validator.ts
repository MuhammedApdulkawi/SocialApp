import z from "zod";
import { isValidObjectId } from "mongoose";
import { POST_PRIVACY } from "../enum/enums";

/**
 * Common validation schemas
 */
const objectIdSchema = z
  .string()
  .refine((id) => isValidObjectId(id), "Invalid ObjectId");

const contentSchema = z
  .string()
  .refine((val) => val.trim().length > 0, "Content cannot be empty")
  .optional();

/**
 * Post Validators
 */
const postValidator = {
  body: z.object({
    description: contentSchema,
    attachments: z.array(z.string()).optional(),
    privacy: z.enum(POST_PRIVACY).optional().default(POST_PRIVACY.PUBLIC),
    allowComments: z.boolean().optional().default(true),
    tags: z.array(objectIdSchema).optional(),
  }),
};

export const createPostValidator = {
  body: postValidator.body.superRefine((val, ctx) => {
    if (!val.description && (!val.attachments || val.attachments.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Description or attachments must be provided",
        path: ["description", "attachments"],
      });
    }
  }),
};

export const updatePostValidator = {
  body: postValidator.body.partial(),
  params: z.object({
    postId: objectIdSchema,
  }),
};

export const deletePostValidator = {
  params: z.object({
    postId: objectIdSchema,
  }),
};

export const getPostValidator = {
  params: z.object({
    postId: objectIdSchema,
  }),
};
