import { Router } from "express";

import postServices from "../service/post.service";
import { authenticationMiddleware } from "../../../middleware";
import { asyncHandler } from "../../../utils";
import { validationMiddleware } from "../../../middleware/validation.middleware";
import {
  createPostValidator,
  updatePostValidator,
  deletePostValidator,
  getPostValidator,
} from "../../../common/validators/post.validator";

const PostController: Router = Router();

PostController.post(
  "/add-post",
  authenticationMiddleware,
  validationMiddleware(createPostValidator),
  asyncHandler(postServices.addPost),
);
PostController.get(
  "/home",
  authenticationMiddleware,
  asyncHandler(postServices.listHomePosts),
);
PostController.get(
  "/user",
  authenticationMiddleware,
  asyncHandler(postServices.listUserPosts),
);
PostController.get(
  "/:postId/comments",
  authenticationMiddleware,
  validationMiddleware(getPostValidator),
  asyncHandler(postServices.getPostWithComments),
);
PostController.put(
  "/update/:postId",
  authenticationMiddleware,
  validationMiddleware(updatePostValidator),
  asyncHandler(postServices.updatePost),
);
PostController.delete(
  "/delete/:postId",
  authenticationMiddleware,
  validationMiddleware(deletePostValidator),
  asyncHandler(postServices.deletePost),
);

export { PostController };
