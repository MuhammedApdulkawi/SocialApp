import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import {
  CommentRepository,
  postRepository,
  reactRepository,
} from "../../../DB/repository";
import { IRequest } from "../../../common";
import {
  BadRequestError,
  pagination,
  postAvailability,
  S3BucketService,
  SuccessResponse,
} from "../../../utils";
import { validateTags } from "../../../utils/services/tags.service.utils";
import {
  createPostValidatorType,
  updatePostValidatorType,
  updatePostParamsType,
  deletePostParamsType,
  getPostParamsType,
} from "../../../common/types/post.validator";

class PostServices {
  private postRepo: postRepository = new postRepository();
  private commentRepo: CommentRepository = new CommentRepository();
  private s3Client = new S3BucketService();
  private reactRepo = new reactRepository();

  addPost = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const {
      description,
      tags,
      allowComments,
      privacy,
    }: createPostValidatorType = req.body;
    const files = req.files as Express.Multer.File[];
    if (!_id) {
      throw new BadRequestError("User ID is required");
    }
    // const files = ["sampleFile.jpg"]; // just for testing
    if (!description && (!files || files.length === 0)) {
      throw new BadRequestError(
        "Either description or attachments are required",
      );
    }

    let uniqueTags: Types.ObjectId[] = [];
    if (tags) {
      uniqueTags = await validateTags(_id, tags as unknown as Types.ObjectId[]);
    }

    let attachments: string[] = [];
    if (files?.length) {
      const uploadedData = await this.s3Client.uploadFilesOnS3(
        files,
        `${_id}/posts`,
      );
      attachments = uploadedData.map(({ key }) => key);
      // attachments = files; // just for testing
    }
    const newPost = await this.postRepo.createNewDocument({
      description,
      attachments,
      ownerId: _id,
      allowComments,
      tags: uniqueTags,
      privacy,
    });
    return res.json(SuccessResponse("Post Added Successfully", 200, newPost));
  };

  listHomePosts = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { page, limit } = req.query;
    if (!_id) {
      throw new BadRequestError("User ID is required");
    }
    const { limit: pageLimit, skip } = pagination({
      page: Number(page),
      limit: Number(limit),
    });
    const posts = await this.postRepo.paginatePosts(
      {
        // attachments:{$ne:[]},
        ownerId: { $ne: _id },
      },
      {
        select: "description",
        limit: pageLimit,
        page: Number(page),
        customLabels: {
          totalDocs: "totalPosts",
          docs: "posts",
          page: "currentPage",
          totalPages: "totalPages",
          pagingCounter: "pagingCounter",
          hasPrevPage: "hasPrevPage",
          hasNextPage: "hasNextPage",
          prevPage: "prevPage",
          nextPage: "nextPage",
          meta: "meta",
        },
        populate: [{ path: "ownerId", select: "firstName lastName" }],
      },
    );
    return res.json(SuccessResponse("Posts Fetched Successfully", 200, posts));
  };

  listUserPosts = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;

    if (!_id) {
      throw new BadRequestError("User ID is required");
    }

    const posts = await this.postRepo.paginatePosts(
      {
        ownerId: _id,
      },
      {
        select: "description -_id",
        limit: 10,
        page: 1,
        customLabels: {
          totalDocs: "totalPosts",
          docs: "posts",
          page: "currentPage",
          totalPages: "totalPages",
          pagingCounter: "pagingCounter",
          hasPrevPage: "hasPrevPage",
          hasNextPage: "hasNextPage",
          prevPage: "prevPage",
          nextPage: "nextPage",
          meta: "meta",
        },
        populate: [{ path: "ownerId", select: "firstName lastName -_id" }],
      },
    );

    return res.json(
      SuccessResponse("Posts Fetched Successfully", 200, posts),
    );
  };

  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { postId } = req.params as updatePostParamsType;
    const {
      description,
      allowComments,
      privacy,
      tags,
    }: updatePostValidatorType = req.body;
    const files = req.files as Express.Multer.File[];

    const post = await this.postRepo.findOneDocument({ _id: postId });
    if (!post) throw new BadRequestError("Post not found");
    if (!post.ownerId.equals(user._id))
      throw new BadRequestError("Unauthorized to update this post");

    // Build update object - only include provided fields
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (allowComments !== undefined) updateData.allowComments = allowComments;
    if (privacy !== undefined) updateData.privacy = privacy;

    // Handle file uploads if provided
    if (files?.length) {
      const uploadedData = await this.s3Client.uploadFilesOnS3(
        files,
        `${user._id}/posts`,
      );
      updateData.attachments = uploadedData.map(({ key }) => key);
      if (post.attachments?.length) {
        await this.s3Client.deleteBulkFromS3(post.attachments);
      }
    }

    // Handle tags if provided
    if (tags) {
      updateData.tags = await validateTags(
        user._id,
        tags as unknown as Types.ObjectId[],
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestError(
        "At least one field must be provided for update",
      );
    }

    const updatedPost = await this.postRepo.updateOneDocument(
      { _id: postId },
      updateData,
    );
    if (!updatedPost) throw new BadRequestError("Failed to update post");

    return res.json(
      SuccessResponse("Post Updated Successfully", 200, updatedPost),
    );
  };

  deletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { postId } = req.params as deletePostParamsType;

    if (!user && !postId) {
      throw new BadRequestError("User and Post ID are required");
    }

    const post = await this.postRepo.findOneDocument({ _id: postId });

    if (!post) {
      throw new BadRequestError("Post not found");
    }
    if (!post.ownerId.equals(user._id)) {
      throw new BadRequestError("Unauthorized to delete this post");
    }

    await this.postRepo.deleteOneDocument({ _id: postId, ownerId: user._id });

    const comments = await this.commentRepo.findAllDocuments({
      refId: postId,
      refType: "Post",
    });
    const reacts = await this.reactRepo.findAllDocuments({
      postId: postId,
      userId: user._id,
    });

    let attachmentsToDelete: string[] = [];
    if (post.attachments && post.attachments.length > 0) {
      attachmentsToDelete.push(...(post.attachments as string[]));
    }

    // Delete all comments and their replies
    if (comments && comments.length > 0) {
      await this.commentRepo.deleteManyDocuments({
        refId: postId,
        refType: "Post",
      });
      attachmentsToDelete.push(
        ...comments.map((comment) => comment.attachment as string),
      );
      const replies = await this.commentRepo.findAllDocuments({
        refId: { $in: comments.map((comment) => comment._id) },
        refType: "Comment",
      });
      if (replies) {
        await this.commentRepo.deleteManyDocuments({
          refId: { $in: replies.map((reply) => reply._id) },
          refType: "Comment",
        });
        attachmentsToDelete.push(
          ...replies.map((reply) => reply.attachment as string),
        );
      }
    }
    if (attachmentsToDelete.length > 0) {
      await this.s3Client.deleteBulkFromS3(attachmentsToDelete);
    }

    if (reacts && reacts.length > 0) {
      await this.reactRepo.deleteManyDocuments({
        postId: postId,
        userId: user._id,
      });
    }

    return res.json(SuccessResponse("Post Deleted Successfully", 200));
  };

  getPostWithComments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { postId } = req.params as getPostParamsType;
    const { user } = (req as unknown as IRequest).loggedInUser;

    if (!postId && !user) {
      throw new BadRequestError("Post ID and User are required");
    }
    // Fetch the post
    const post = await this.postRepo.findOneDocument(
      { _id: postId },
      {},
      { populate: [{ path: "ownerId", select: "firstName lastName" }] },
    );

    if (!post) {
      throw new BadRequestError("Post not found");
    }

    // Check user authorization
    if (user && !(await postAvailability(post, user))) {
      throw new BadRequestError("Unauthorized to view this post");
    }

    // Fetch all comments for this post
    const comments = await this.commentRepo.findAllDocuments(
      { refId: postId, refType: "Post" },
      {},
      { populate: [{ path: "ownerId", select: "firstName lastName" }] },
    );

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment: any) => {
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
      SuccessResponse("Post with comments fetched successfully", 200, {
        post,
        comments: commentsWithReplies,
      }),
    );
  };
}
export default new PostServices();
