import { z } from "zod";
import { createPostValidator, updatePostValidator } from "../validators";


export type createPostValidatorType = z.infer<typeof createPostValidator.body>;
export type updatePostValidatorType = z.infer<typeof updatePostValidator.body>;
export type updatePostParamsType = z.infer<typeof updatePostValidator.params>;
export type deletePostParamsType = z.infer<typeof updatePostValidator.params>;
export type getPostParamsType = z.infer<typeof updatePostValidator.params>;
