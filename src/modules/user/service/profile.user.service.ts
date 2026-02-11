import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";

import {
  BlacklistRepository,
  CommentRepository,
  ConversationRepository,
  FriendshipRepository,
  MessageRepository,
  postRepository,
  UserRepository,
} from "../../../DB/repository";
import {
  IRequest,
  FRIENDSHIP_STATUS,
  IUser,
  IFriendship,
  CONVERSATION_TYPE,
  OTP_TYPE,
  IOTP,
  KEY_TYPE,
} from "../../../common";
import {
  BlacklistedTokenModel,
  FriendshipModel,
  User,
  PostModel,
  CommentModel,
  MessageModel,
  ReactModel,
  ConversationModel,
} from "../../../DB/models";
import {
  BadRequestError,
  emitter,
  generateEmailContent,
  isFriendService,
  S3BucketService,
  sendEmail,
  sendOTPService,
  SuccessResponse,
  verifyOTP,
} from "../../../utils";
import { FilterQuery } from "mongoose";
import { reactRepository } from "../../../DB/repository/react.repository";
import {
  blockUserValidatorType,
  getProfileValidatorType,
  resendOTPValidatorType,
  unBlockUserValidatorType,
  updateProfileValidatorType,
} from "../../../common/types/user.profile.validator";
import {
  listFriendsValidatorType,
  respondFriendValidatorType,
  sendOrRemoveFriendValidatorType,
} from "../../../common/types/friend.validator";
import { Type } from "@aws-sdk/client-s3";

class ProfileUserService {
  private friendshipRepo: FriendshipRepository = new FriendshipRepository();
  private userRepo = new UserRepository(User);
  private conversationRepo = new ConversationRepository();
  private blockListRepo = new BlacklistRepository(BlacklistedTokenModel);
  private postRepo = new postRepository();
  private commentRepo = new CommentRepository();
  private messageRepo = new MessageRepository();
  private reactRepo = new reactRepository();
  private s3Client = new S3BucketService();

  respondFriend = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { requestFromId, status }: respondFriendValidatorType = req.body;

    const user = await this.userRepo.findOneDocument({ _id: requestFromId });
    if (!user) throw new BadRequestError("Invalid User ID");

    const friendship = await this.friendshipRepo.findOneDocument({
      requestFromId,
      requestToId: _id,
      status: FRIENDSHIP_STATUS.PENDING,
    });
    if (!friendship)
      throw new BadRequestError("No Friend Request Found For This User");

    await this.friendshipRepo.findOneAndUpdateDocument(
      {
        requestFromId,
        requestToId: _id,
        status: FRIENDSHIP_STATUS.PENDING,
      },
      { status: status },
    );
    return res.json(SuccessResponse("Friendship Updated Successfully", 200));
  };

  sendFriendRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { requestToId }: sendOrRemoveFriendValidatorType = req.body;

    // Validation Checks - Check if user is trying to send friend request to themselves
    if (_id.toString() === requestToId.toString())
      throw new BadRequestError("You can't add yourself as a friend");
    // Check if the user to send request to exists
    const user = await this.userRepo.findOneDocument({
      _id: requestToId,
    });
    if (!user) throw new BadRequestError("Invalid User ID");

    // Check if the user to send request to has blocked the logged in user
    const isBlockedByTarget = await this.userRepo.findOneDocument({
      _id: requestToId,
      blockList: { $in: [_id] },
    });
    if (isBlockedByTarget)
      throw new BadRequestError("You cannot send friend request to this user");

    // Check if the logged in user has blocked the user to send request to
    const isBlockedByUser = await this.userRepo.findOneDocument({
      _id,
      blockList: { $in: [requestToId] },
    });
    if (isBlockedByUser)
      throw new BadRequestError(
        `You have blocked this user, unblock to send friend request`,
      );

    // Check if they are already friends
    const isFriend = await isFriendService(
      requestToId as unknown as Types.ObjectId,
      _id,
    );
    if (isFriend) throw new BadRequestError("You are already friends");

    // Check if there is already a pending friend request from the target user to logged in user
    const existingRequestFromTarget = await this.friendshipRepo.findOneDocument(
      {
        requestFromId: requestToId,
        requestToId: _id,
        status: FRIENDSHIP_STATUS.PENDING,
      },
    );
    if (existingRequestFromTarget)
      throw new BadRequestError(
        "This user has already sent you a friend request, please respond to it.",
      );

    // Check if there is already a pending friend request from logged in user to this user
    const existingRequestToTarget = await this.friendshipRepo.findOneDocument({
      requestFromId: _id,
      requestToId: requestToId,
      status: FRIENDSHIP_STATUS.PENDING,
    });
    if (existingRequestToTarget)
      throw new BadRequestError(
        "You have already sent a friend request to this user.",
      );

    await this.friendshipRepo.createNewDocument({
      requestFromId: _id,
      requestToId: requestToId as unknown as Types.ObjectId,
    });

    return res.json(SuccessResponse("Friend Request Sent Successfully", 200));
  };

  removeFriend = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { requestToId }: sendOrRemoveFriendValidatorType = req.body;

    const user = await this.userRepo.findOneDocument({ _id: requestToId });
    if (!user) throw new BadRequestError("Invalid User ID");

    const friendship = await isFriendService(
      requestToId as unknown as Types.ObjectId,
      _id,
    );
    if (!friendship)
      throw new BadRequestError("No FriendShip Found For This User");

    await this.friendshipRepo.deleteOneDocument({
      $or: [
        { requestFromId: _id, requestToId: requestToId },
        { requestFromId: requestToId, requestToId: _id },
      ],
      status: FRIENDSHIP_STATUS.ACCEPTED,
    });

    return res.json(
      SuccessResponse("Friend Request Removed Successfully", 200),
    );
  };

  listFriendsAndGroups = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { status }: listFriendsValidatorType = req.body;

    const filter: FilterQuery<IFriendship> = {
      status: status ? status : FRIENDSHIP_STATUS.PENDING,
    };

    if (status === FRIENDSHIP_STATUS.ACCEPTED) {
      filter.$or = [{ requestFromId: _id }, { requestToId: _id }];
    } else {
      filter.requestToId = _id;
    }

    const friends = await this.friendshipRepo.findAllDocuments(
      filter,
      undefined,
      {
        populate: [
          {
            path: "requestFromId",
            select: "firstName lastName",
          },
          {
            path: "requestToId",
            select: "firstName lastName",
          },
        ],
      },
    );
    const groups = await this.conversationRepo.findAllDocuments({
      type: CONVERSATION_TYPE.GROUP,
      members: { $in: [_id] },
    });
    return res.json(
      SuccessResponse(`${status} Friends Fetched Successfully`, 200, {
        friends,
        groups,
      }),
    );
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params as unknown as getProfileValidatorType;
    if (!userId) throw new BadRequestError("User ID is required");
    const user = await this.userRepo.findOneDocument({ _id: userId });
    if (!user) throw new BadRequestError("Invalid User ID");
    return res.json(SuccessResponse("Profile Fetched Successfully", 200, user));
  };

  getAllProfiles = async (req: Request, res: Response, next: NextFunction) => {
    const users = await this.userRepo.findAllDocuments();
    return res.json(
      SuccessResponse<IUser[]>("Profiles Fetched Successfully", 200, users),
    );
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const {
      firstName,
      lastName,
      phoneNumber,
      gender,
      DOB,
    }: updateProfileValidatorType = req.body;
    if (!firstName && !lastName && !phoneNumber && !gender && !DOB) {
      throw new BadRequestError(
        "At least one field must be provided for update",
      );
    }
    await this.userRepo.updateOneDocument(
      { _id },
      { firstName, lastName, phoneNumber, gender, DOB },
    );
    return res.json(SuccessResponse("Profile Updated Successfully", 200));
  };

  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    if (!_id) throw new BadRequestError("User ID is required");
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) throw new BadRequestError("Invalid User");
    try {
      // Delete user
      await this.userRepo.deleteDocumentById(_id);

      // Collect all S3 keys to delete
      const s3KeysToDelete: string[] = [];

      // Get user to collect profile image and cover pic
      if (user?.profileImage) {
        s3KeysToDelete.push(user.profileImage);
      }
      if (user?.coverPic) {
        s3KeysToDelete.push(user.coverPic);
      }

      // Get all user's posts and collect attachment keys
      const userPosts = await this.postRepo.findAllDocuments({ ownerId: _id });
      userPosts.forEach((post) => {
        if (post.attachments && post.attachments.length > 0) {
          s3KeysToDelete.push(...post.attachments);
        }
      });

      // Get all user's comments and collect attachment keys
      const userComments = await this.commentRepo.findAllDocuments({
        ownerId: _id,
      });
      userComments.forEach((comment) => {
        if (comment.attachment && comment.attachment.length > 0) {
          s3KeysToDelete.push(comment.attachment);
        }
      });

      // Get all user's messages and collect attachment keys
      const userMessages = await this.messageRepo.findAllDocuments({
        senderId: _id,
      });
      userMessages.forEach((message) => {
        if (message.attachments && message.attachments.length > 0) {
          s3KeysToDelete.push(...message.attachments);
        }
      });

      // Delete all collected S3 files in bulk
      if (s3KeysToDelete.length > 0) {
        await this.s3Client.deleteBulkFromS3(s3KeysToDelete);
      }

      // Delete database records (order matters to avoid reference issues)
      await this.postRepo.deleteManyDocuments({ ownerId: _id });
      await this.commentRepo.deleteManyDocuments({ ownerId: _id });
      await this.reactRepo.deleteManyDocuments({ userId: _id });
      await this.messageRepo.deleteManyDocuments({ senderId: _id });
      await this.conversationRepo.deleteManyDocuments({
        members: { $in: [_id] },
      });
      await this.friendshipRepo.deleteManyDocuments({
        $or: [{ requestFromId: _id }, { requestToId: _id }],
      });

      return res.json(SuccessResponse("Profile Deleted Successfully", 200));
    } catch (error) {
      throw new BadRequestError("Error deleting profile. Please try again.");
    }
  };

  uploadProfilePicture = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const file = req;
    if (!user) throw new BadRequestError("Invalid User");
    if (!file) throw new BadRequestError("No file uploaded");

    const { key, url } = await this.s3Client.uploadFileOnS3(
      file as unknown as Express.Multer.File,
      `${user._id}/profile-pictures`,
    );

    user.profileImage = key;
    await user.save();
    return res.json(
      SuccessResponse("Profile Picture Uploaded Successfully", 200, {
        profilePicture: { key, url },
      }),
    );
  };

  renewSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { key, keyType } = req.query as {
      key: string;
      keyType: KEY_TYPE;
    };
    if (!_id) throw new BadRequestError("User ID is required");
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) throw new BadRequestError("Invalid User");

    if (!key || !keyType)
      throw new BadRequestError("Key and keyType are required");

    // Validate that user has access to this key based on keyType
    if (keyType === KEY_TYPE.PROFILE_IMAGE) {
      if (!user.profileImage || user.profileImage !== key)
        throw new BadRequestError("Invalid profile image key for this user");
    } else if (keyType === KEY_TYPE.COVER_IMAGE) {
      if (!user.coverPic || user.coverPic !== key)
        throw new BadRequestError("Invalid cover image key for this user");
    } else if (keyType === KEY_TYPE.POST_IMAGE) {
      const post = await this.postRepo.findOneDocument({
        _id: key,
        userId: user._id,
      });
      if (!post)
        throw new BadRequestError("Invalid post image key for this user");
    } else if (keyType === KEY_TYPE.COMMENT_IMAGE) {
      const comment = await this.commentRepo.findOneDocument({
        _id: key,
        userId: user._id,
      });
      if (!comment)
        throw new BadRequestError("Invalid comment image key for this user");
    }

    const url = await this.s3Client.getFileWIthSignedUrl(key);
    return res.json(
      SuccessResponse("Profile Picture Fetched Successfully", 200, {
        profilePicture: { key, url },
      }),
    );
  };

  uploadLargeFile = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    if (!user) throw new BadRequestError("User not found");
    const file = req;

    if (!file) throw new BadRequestError("No file uploaded");

    const { key, url } = await this.s3Client.uploadLargeFileOnS3(
      file as unknown as Express.Multer.File,
      `${user._id}/large-files`,
    );
    return res.json(
      SuccessResponse("Large File Uploaded Successfully", 200, { key, url }),
    );
  };

  createChatGroup = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { name, membersIds } = req.body;

    // Validation Checks
    const currentUser = await this.userRepo.findOneDocument({ _id });
    if (!currentUser) throw new BadRequestError("Invalid User");

    for (const memberId of membersIds) {
      // Check if user has blocked any of the members
      if (currentUser.blockList && currentUser.blockList.length > 0) {
        if (currentUser.blockList.some((b) => b.equals(memberId))) {
          throw new BadRequestError(
            "You cannot add blocked users to the group",
          );
        }
      }
      // Check if user is trying to add themselves to the group
      if (memberId.toString() === _id.toString()) {
        throw new BadRequestError("You cannot add yourself to the group");
      }

      // Check if member exists
      const member = await this.userRepo.findOneDocument({ _id: memberId });
      if (!member) throw new BadRequestError("Invalid Member ID");

      // Check if member has blocked the current user
      if (member.blockList && member.blockList.some((b) => b.equals(_id))) {
        throw new BadRequestError(`${member.firstName} has blocked you`);
      }

      // Check if member is already a friend
      const isFriend = await isFriendService(
        memberId as unknown as Types.ObjectId,
        _id,
      );
      if (!isFriend)
        throw new BadRequestError(
          `You can only add friends to the group. ${member.firstName} is not your friend.`,
        );
    }

    const group = await this.conversationRepo.createNewDocument({
      name,
      members: [_id, ...membersIds],
      type: CONVERSATION_TYPE.GROUP,
    });
    return res.json(SuccessResponse("Group Created Successfully", 200, group));
  };

  searchUser = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    const { name } = req.query;
    if (!user) throw new BadRequestError("Invalid User");
    if (!name) throw new BadRequestError("Please provide a name to search for");

    const users = await this.userRepo.findAllDocuments({
      $or: [
        { firstName: { $regex: name as string, $options: "i" } },
        { lastName: { $regex: name as string, $options: "i" } },
      ],
    });

    // Filter out users who have blocked the logged in user
    const filteredUsers = users.filter((u) => {
      // Don't show users who have blocked us
      if (
        u.blockList &&
        u.blockList.some((blocked) => blocked.equals(user._id))
      ) {
        return false;
      }
      return true;
    });

    if (!filteredUsers || filteredUsers.length === 0)
      return res.json(SuccessResponse("No users found", 200, []));
    return res.json(SuccessResponse("Search Results", 200, filteredUsers));
  };

  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { blockUserId }: blockUserValidatorType = req.body;
    if (!_id) throw new BadRequestError("User ID is required");
    if (!blockUserId) throw new BadRequestError("Block User ID is required");
    if (_id.equals(blockUserId))
      throw new BadRequestError("You can't block yourself");

    const currentUser = await this.userRepo.findOneDocument({ _id });
    if (!currentUser) throw new BadRequestError("Invalid User");

    const userToBlock = await this.userRepo.findOneDocument({
      _id: blockUserId,
    });
    if (!userToBlock) throw new BadRequestError("Invalid User ID");

    // Check if already blocked this user
    if (
      currentUser.blockList &&
      currentUser.blockList.includes(new Types.ObjectId(blockUserId))
    )
      throw new BadRequestError("You have already blocked this user");

    // If they are friends, remove the friendship
    if (await isFriendService(new Types.ObjectId(blockUserId), _id)) {
      await this.friendshipRepo.deleteOneDocument({
        $or: [
          { requestFromId: _id, requestToId: blockUserId },
          { requestFromId: blockUserId, requestToId: _id },
        ],
      });
    }

    await this.userRepo.findOneAndUpdateDocument(
      { _id },
      { $addToSet: { blockList: blockUserId } },
    );

    return res.json(SuccessResponse("User Blocked Successfully", 200));
  };

  getAllBlockedUsers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    if (!_id) throw new BadRequestError("User ID is required");
    const user = await this.userRepo.findOneDocument(
      { _id },
      { blockList: 1 },
      { populate: { path: "blockList", select: "firstName lastName email" } },
    );
    if (!user) throw new BadRequestError("Invalid User");
    return res.json(
      SuccessResponse(
        "Blocked Users Fetched Successfully",
        200,
        user?.blockList || [],
      ),
    );
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { unblockUserId }: unBlockUserValidatorType = req.body;
    if (!_id) throw new BadRequestError("User ID is required");
    if (!unblockUserId)
      throw new BadRequestError("Unblock User ID is required");
    const user = await this.userRepo.findOneDocument({ _id });

    if (!user) throw new BadRequestError("Invalid User");
    if (
      !user.blockList ||
      !user.blockList.includes(new Types.ObjectId(unblockUserId))
    )
      throw new BadRequestError("This user is not in your block list");

    await this.userRepo.findOneAndUpdateDocument(
      { _id },
      { $pull: { blockList: new Types.ObjectId(unblockUserId) } },
    );
    return res.json(SuccessResponse("User Unblocked Successfully", 200));
  };

  resendOTPVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { user } = (req as unknown as IRequest).loggedInUser;
    if (!user) throw new BadRequestError("Invalid User");
    const userData = await this.userRepo.findOneDocument({ _id: user._id });
    if (!userData) throw new BadRequestError("Invalid User");
    if (userData.isEmailVerified)
      throw new BadRequestError("Email is already verified");
    await this.userRepo.updateWithSave(
      { _id: user._id },
      {
        otps: sendOTPService(userData, OTP_TYPE.VERIFY).otps,
      },
    );
    return res.json(SuccessResponse("OTP has been resent to your email", 200));
  };

  resendOTPResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email }: resendOTPValidatorType = req.body;
    if (!email) throw new BadRequestError("Email is required");
    const user = await this.userRepo.findOneDocument({ email });
    if (!user) throw new BadRequestError("Invalid Email");
    await this.userRepo.updateWithSave(
      { email },
      {
        otps: sendOTPService(user, OTP_TYPE.RESET).otps,
      },
    );
    return res.json(SuccessResponse("OTP has been resent to your email", 200));
  };

  updateEmail = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    if (!_id) throw new BadRequestError("User ID is required");
    const userData = await this.userRepo.findOneDocument({ _id });
    if (!userData) throw new BadRequestError("Invalid User");
    await this.userRepo.updateWithSave(
      { _id },
      {
        otps: sendOTPService(userData, OTP_TYPE.CHANGE_EMAIL).otps,
      },
    );
    return res.json(SuccessResponse("OTP has been sent to your email", 200));
  };

  changeEmail = async (req: Request, res: Response, next: NextFunction) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const { email, inputOTP } = req.body;
    if (!_id) throw new BadRequestError("User ID is required");
    if (!inputOTP || !email)
      throw new BadRequestError("All fields are required");
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) throw new BadRequestError("Invalid User");
    if (email === user.email)
      throw new BadRequestError("New email must be different from current");

    const userData = await this.userRepo.findOneDocument({ email });
    if (userData) throw new BadRequestError("Email is already in use");

    const verifyOtp = user.otps?.find(
      (o) => o.otpType === OTP_TYPE.CHANGE_EMAIL,
    );

    const result = verifyOTP({
      inputOTP,
      storedOTP: verifyOtp as IOTP,
    });

    if (!result.valid) {
      await user.save();
      return res.status(400).json({
        success: false,
        reason: result.reason,
        ...(result.reason === "OTP_BANNED" && {
          remainingSeconds: result.remainingSeconds,
        }),
      });
    }
    const filteredOtps = (user.otps as IOTP[]).filter(
      (otp) =>
        otp.otpType !== OTP_TYPE.CHANGE_EMAIL &&
        otp.otpType !== OTP_TYPE.VERIFY,
    );
    const userForOtp = {
      ...(user.toObject ? user.toObject() : (user as unknown as IUser)),
      email,
      otps: filteredOtps,
    } as IUser;
    const { otps } = sendOTPService(userForOtp, OTP_TYPE.VERIFY);
    await this.userRepo.updateWithSave(
      { _id },
      {
        email,
        isEmailVerified: false,
        otps,
      },
    );
    return res.json(
      SuccessResponse(
        "Email has been changed successfully, For verification The OTP has been sent to your new email",
        200,
      ),
    );
  };

  deactivateAccount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const {
      token: { tokenId, expirationDate },
    } = (req as unknown as IRequest).loggedInUser;
    if (!_id || !tokenId || !expirationDate)
      throw new BadRequestError("Invalid User");
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) throw new BadRequestError("Invalid User");

    if (user.deactivateAccount?.deactivate) {
      throw new BadRequestError("Account is already deactivated");
    }

    await this.userRepo.updateWithSave(
      { _id },
      { deactivateAccount: { deactivate: true, deactivatedAt: new Date() } },
    );
    await this.blockListRepo.createNewDocument({
      accessTokenId: tokenId,
      expirationDate,
    });
    emitter.emit("sendEmail", {
      to: user.email,
      ...generateEmailContent(
        "account-deactivated",
        `${user.firstName} ${user.lastName}`,
      ),
    });
    return res.json(SuccessResponse("Account has been deactivated", 200));
  };
}

export default new ProfileUserService();
