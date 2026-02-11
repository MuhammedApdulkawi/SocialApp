import { z } from "zod";
import { createCommentValidator, updateCommentValidator } from "../validators";


export type createCommentValidatorType = z.infer<
  typeof createCommentValidator.body
>;
export type createCommentParamsType = z.infer<
  typeof createCommentValidator.params
>;
export type updateCommentValidatorType = z.infer<
  typeof updateCommentValidator.body
>;
export type updateCommentParamsType = z.infer<
  typeof updateCommentValidator.params
>;
export type deleteCommentParamsType = z.infer<
  typeof updateCommentValidator.params
>;
export type getCommentByIdParamsType = z.infer<typeof updateCommentValidator.params>;

export type getCommentParamsType = z.infer<typeof createCommentValidator.params>;

export type getRepliesParamsType = z.infer<typeof updateCommentValidator.params>;