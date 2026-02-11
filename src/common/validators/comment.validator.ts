import z from "zod";
import { isValidObjectId } from "mongoose";

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
 * Comment Validators
 */
const commentValidator = {
  body: z.object({
    content: contentSchema,
    attachment: z.string().optional(),
    refType: z.enum(["Post", "Comment"]),
    tags: z.array(objectIdSchema).optional(),
  }),
  params: z.object({
    refId: objectIdSchema,
  }),
};

export const createCommentValidator = {
  body: commentValidator.body.superRefine((val, ctx) => {
    if (!val.content && !val.attachment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Content or attachment must be provided",
        path: ["content", "attachment"],
      });
    }
  }),
  params: commentValidator.params,
};

export const updateCommentValidator = {
  body: commentValidator.body.partial(),
  params: z.object({
    commentId: objectIdSchema,
  }),
};

export const deleteCommentValidator = {
  params: z.object({
    commentId: objectIdSchema,
  }),
};