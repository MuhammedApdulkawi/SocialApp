import { Router } from "express";
import commentServices from "../service/comment.service";
import { authenticationMiddleware } from "../../../middleware";
import { asyncHandler } from "../../../utils";
import {
  createCommentValidator,
  updateCommentValidator,
  deleteCommentValidator,
} from "../../../common/validators/comment.validator";
import { validationMiddleware } from "../../../middleware/validation.middleware";

const CommentController = Router();

CommentController.post(
  "/addComment/:refId",
  authenticationMiddleware,
  validationMiddleware(createCommentValidator),
  asyncHandler(commentServices.addComment),
);

CommentController.delete(
  "/deleteComment/:commentId",
  authenticationMiddleware,
  validationMiddleware(deleteCommentValidator),
  asyncHandler(commentServices.deleteComment),
);

CommentController.put(
  "/updateComment/:commentId",
  authenticationMiddleware,
  validationMiddleware(updateCommentValidator),
  asyncHandler(commentServices.updateComment),
);

CommentController.get(
  "/getComments/:refId",
  authenticationMiddleware,
  validationMiddleware({ params: deleteCommentValidator.params }),
  asyncHandler(commentServices.getComments),
);

CommentController.get(
  "/getCommentById/:commentId",
  authenticationMiddleware,
  validationMiddleware({ params: deleteCommentValidator.params }),
  asyncHandler(commentServices.getCommentById),
);

CommentController.get(
  "/getAllRepliesForComment/:commentId",
  authenticationMiddleware,
  validationMiddleware({ params: deleteCommentValidator.params }),
  asyncHandler(commentServices.getAllRepliesForComment),
);

export { CommentController };
