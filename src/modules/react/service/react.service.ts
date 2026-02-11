import { NextFunction, Request, Response } from "express";
import { reactRepository } from "../../../DB/repository/react.repository";
import { IRequest } from "../../../common";
import { postRepository } from "../../../DB/repository";
import {
  BadRequestError,
  postAvailability,
  SuccessResponse,
} from "../../../utils";
import { Types } from "mongoose";
import {
  createReactValidatorType,
  getPostReactsParamsType,
} from "../../../common/types/react.validator";

class reactService {
  private reactRepo: reactRepository = new reactRepository();
  private postRepo: postRepository = new postRepository();

  React = async (req: Request, res: Response, next: NextFunction) => {
      const { user } = (req as unknown as IRequest).loggedInUser;
      const { postId, type }: createReactValidatorType = req.body;
      if (!user) throw new BadRequestError("User not logged in");
      if (!postId || !type)
        throw new BadRequestError("Post ID and React Type are required");
      const post = await this.postRepo.findOneDocument({ _id: postId });
      if (!post || !(await postAvailability(post, user))) {
        throw new BadRequestError("Invalid Post ID");
      }
      const react = await this.reactRepo.findOneDocument({
        postId,
        userId: user._id,
      });
      if (react) {
        if (react.type === type) {
          await this.reactRepo.deleteOneDocument({ _id: react._id });
        } else {
          await this.reactRepo.updateOneDocument({ _id: react._id }, { type });
        }
        return res.json(SuccessResponse("Reacted Successfully", 200));
      }
      await this.reactRepo.createNewDocument({
        postId: postId as unknown as Types.ObjectId,
        userId: user._id,
        type,
      });
      return res.json(SuccessResponse("Reacted Successfully", 200));
   
  };

  listAllReactsForPost = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
      const { postId } = req.params as getPostReactsParamsType;
      const { user } = (req as unknown as IRequest).loggedInUser;
      if (!user) throw new BadRequestError("User not logged in");
      if (!postId) throw new BadRequestError("Post ID is required");
      const post = await this.postRepo.findOneDocument({ _id: postId });
      if (!post || !(await postAvailability(post, user))) {
        throw new BadRequestError(
          "Invalid Post ID or Post is not available for your account",
        );
      }

      const reacts = await this.reactRepo.findAllDocuments(
        { postId },
        {},
        { populate: [{ path: "userId", select: "firstName lastName" }] },
      );
      if (!reacts || reacts.length === 0) {
        return res.json(
          SuccessResponse("Reacts Fetched Successfully", 200, { reacts: [] }),
        );
      }

      return res.json(
        SuccessResponse("Reacts Fetched Successfully", 200, { reacts }),
      );
  };
}

export default new reactService();
