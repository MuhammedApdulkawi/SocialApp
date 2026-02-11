import { NextFunction, Request, Response } from "express";
import { IRequest } from "../../../common";
import { CommentRepository, postRepository } from "../../../DB/repository";
import { Types } from "mongoose";
import {
  BadRequestError,
  postAvailability,
  S3BucketService,
  SuccessResponse,
} from "../../../utils";
import { validateTags } from "../../../utils/services/tags.service.utils";
import {
  createCommentParamsType,
  createCommentValidatorType,
  deleteCommentParamsType,
  getCommentByIdParamsType,
  getCommentParamsType,
  getRepliesParamsType,
  updateCommentParamsType,
  updateCommentValidatorType,
} from "../../../common/types/comment.validator";

class commentServices {
  private postRepo: postRepository = new postRepository();
  private commentRepo: CommentRepository = new CommentRepository();
  private s3Client = new S3BucketService();

  addComment = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { refId } = req.params as createCommentParamsType;
    const { content, refType, tags } = req.body as createCommentValidatorType;
    const file = req.file as Express.Multer.File;
    if (!_id && !refId && !refType) {
      throw new BadRequestError("User ID, refId and refType are required");
    }
    if (!content && !file) {
      throw new BadRequestError("Content or attachment is required");
    }

    if (refType === "Post") {
      const post = await this.postRepo.findOneDocument({
        _id: refId,
        allowComments: true,
      });

      if (!post) {
        throw new BadRequestError(
          "Invalid Post ID or Comments are disabled for this post",
        );
      }

      if (post.ownerId.equals(_id)) {
        return;
      } else {
        await postAvailability(post, { _id } as any);
      }
    } else if (refType === "Comment") {
      const comment = await this.commentRepo.findOneDocument({ _id: refId });

      if (!comment) {
        throw new BadRequestError("Invalid Comment ID");
      }
    }

    let attachment: string | undefined;

    if (file) {
      const uploadedData = await this.s3Client.uploadFileOnS3(
        file,
        `${_id}/comments`,
      );
      attachment = uploadedData.key;
    }
    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      uniqueTags = await validateTags(_id, tags as unknown as Types.ObjectId[]);
    }
    const comment = await this.commentRepo.createNewDocument({
      content,
      refId: refId as unknown as Types.ObjectId,
      attachment,
      ownerId: _id,
      refType,
      tags: uniqueTags,
    });

    return res.json(
      SuccessResponse("Comment added successfully", 200, comment),
    );
  };

  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { id },
    } = (req as unknown as IRequest).loggedInUser;
    const { commentId } = req.params as updateCommentParamsType;
    const { content, tags } = req.body as updateCommentValidatorType;
    const file = req.file as Express.Multer.File;
    if (!id && !commentId) {
      throw new BadRequestError("User ID and Comment ID are required");
    }
    const comment = await this.commentRepo.findOneDocument({ _id: commentId });
    if (!comment) throw new BadRequestError("Invalid Comment ID");

    let uploadedData: string | undefined;
    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      uniqueTags = await validateTags(id, tags as unknown as Types.ObjectId[]);
    }
    if (file) {
      const { key } = await this.s3Client.uploadFileOnS3(
        file,
        `${id}/comments`,
      );
      uploadedData = key;
      if (comment.attachment) {
        await this.s3Client.deleteFileFromS3(comment.attachment);
      }
    }

    if (!comment.ownerId.equals(id)) throw new BadRequestError("Unauthorized");
    await this.commentRepo.updateOneDocument(
      { _id: commentId },
      { content, attachment: uploadedData, tags: uniqueTags },
    );
    return res.json(SuccessResponse("Comment updated successfully", 200));
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { id },
    } = (req as unknown as IRequest).loggedInUser;
    const { commentId } = req.params as deleteCommentParamsType;

    if (!id && !commentId) {
      throw new BadRequestError("User ID and Comment ID are required");
    }
    const comment = await this.commentRepo.findOneDocument({ _id: commentId });

    if (!comment) throw new BadRequestError("Invalid Comment ID");
    if (!comment.ownerId.equals(id)) throw new BadRequestError("Unauthorized");

    await this.commentRepo.deleteOneDocument({ _id: commentId });

    const replies = await this.commentRepo.findAllDocuments({
      refId: commentId,
      refType: "Comment",
    });
    if (replies && replies.length > 0) {
      for (const reply of replies) {
        await this.commentRepo.deleteOneDocument({ _id: reply._id });
      }
    }
    if (comment.attachment) {
      await this.s3Client.deleteFileFromS3(comment.attachment);
    }

    return res.json(SuccessResponse("Comment deleted successfully", 200));
  };

  getComments = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { refId } = req.params as getCommentParamsType;
    if (!user && !refId) {
      throw new BadRequestError("User and refId are required");
    }
    // Check if refId is a valid Post
    const post = await this.postRepo.findOneDocument({ _id: refId });

    if (post) {
      // If it's a post, check if user has access
      if (user && !(await postAvailability(post, user as any))) {
        throw new BadRequestError("Unauthorized to view comments of this post");
      }
    } else {
      // If it's not a post, check if it's a valid comment
      const comment = await this.commentRepo.findOneDocument({ _id: refId });
      if (!comment) {
        throw new BadRequestError("Invalid refId - Post or Comment not found");
      }
    }

    // Fetch all comments for this refId
    const comments = await this.commentRepo.findAllDocuments(
      { refId },
      {},
      { populate: [{ path: "ownerId", select: "firstName lastName" }] },
    );

    if (!comments || comments.length === 0) {
      return res.json(
        SuccessResponse("No comments found", 200, { comments: [] }),
      );
    }
    // Fetch replies (nested comments) for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await this.commentRepo.findAllDocuments(
          { refId: comment._id, refType: "Comment" },
          {},
          { populate: [{ path: "ownerId", select: "firstName lastName" }] },
        );
        return {
          ...(comment.toObject?.() || comment),
          replies: replies || [],
        };
      }),
    );

    return res.json(
      SuccessResponse("Comments fetched successfully", 200, {
        comments: commentsWithReplies,
      }),
    );
  };

  getCommentById = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { commentId } = req.params as getCommentByIdParamsType;

    if (!user && !commentId) {
      throw new BadRequestError("User and Comment ID are required");
    }
    // Get the specific comment/reply
    const comment = await this.commentRepo.findOneDocument({ _id: commentId });
    if (!comment) {
      throw new BadRequestError("Comment not found");
    }

    // Find the root post to check authorization
    let rootRefId = comment.refId;
    let refType = comment.refType;

    // If this is a reply (refType is Comment), traverse up to find the root post
    while (refType === "Comment") {
      const parentComment = await this.commentRepo.findOneDocument({
        _id: rootRefId,
      });
      if (!parentComment) {
        throw new BadRequestError("Parent comment not found");
      }
      rootRefId = parentComment.refId;
      refType = parentComment.refType;
    }

    // Check authorization for the root post
    const post = await this.postRepo.findOneDocument({ _id: rootRefId });
    if (!post) {
      throw new BadRequestError("Related post not found");
    }

    if (user && !(await postAvailability(post, user as any))) {
      throw new BadRequestError("Unauthorized to view this comment");
    }

    // Populate owner info
    const populatedComment = await this.commentRepo.findOneDocument(
      { _id: commentId },
      {},
      { populate: [{ path: "ownerId", select: "firstName lastName" }] },
    );

    return res.json(
      SuccessResponse("Comment fetched successfully", 200, {
        comment: populatedComment,
      }),
    );
  };

  getAllRepliesForComment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { commentId } = req.params as getRepliesParamsType;
    if (!user && !commentId) {
      throw new BadRequestError("User and Comment ID are required");
    }
    const comment = await this.commentRepo.findOneDocument({ _id: commentId });
    if (!comment) {
      throw new BadRequestError("Comment not found");
    }
    const replies = await this.commentRepo.findAllDocuments(
      { refId: commentId, refType: "Comment" },
      {},
      { populate: [{ path: "ownerId", select: "firstName lastName" }] },
    );
    return res.json(
      SuccessResponse("Replies fetched successfully", 200, {
        replies,
      }),
    );
  };
}

export default new commentServices();
