import { Router } from "express";

import ProfileUserService from "../service/profile.user.service";
import {
  authenticationMiddleware,
  Multer,
  validationMiddleware,
} from "../../../middleware";
import { asyncHandler } from "../../../utils";
import {
  blockUserValidator,
  changeEmailValidator,
  createGroupValidator,
  getProfileValidator,
  listFriendsValidator,
  renewSignedUrlValidator,
  respondFriendValidator,
  searchUserValidator,
  sendOrRemoveFriendValidator,
  unBlockUserValidator,
  updateProfileValidator,
} from "../../../common";

const ProfileUserController = Router();



// send friend request 
ProfileUserController.post(
  "/send-friend-request",
  authenticationMiddleware,
  validationMiddleware(sendOrRemoveFriendValidator),
  asyncHandler(ProfileUserService.sendFriendRequest),
);
// remove friend route
ProfileUserController.post(
  "/remove-friend",
  authenticationMiddleware,
  validationMiddleware(sendOrRemoveFriendValidator),
  asyncHandler(ProfileUserService.removeFriend),
);
// respond to friend request route
ProfileUserController.post(
  "/respond-friend",
  validationMiddleware(respondFriendValidator),
  authenticationMiddleware,
  asyncHandler(ProfileUserService.respondFriend),
);
// list friend requests route
ProfileUserController.get(
  "/list-friends-and-groups",
  authenticationMiddleware,
  validationMiddleware(listFriendsValidator),
  asyncHandler(ProfileUserService.listFriendsAndGroups),
);
// get user profile route
ProfileUserController.get(
  "/get-profile/:userId",
  validationMiddleware(getProfileValidator),
  asyncHandler(ProfileUserService.getProfile),
);


// get all profiles route
ProfileUserController.get(
  "/get-all-profiles",
  asyncHandler(ProfileUserService.getAllProfiles),
);
// update user profile route
ProfileUserController.put(
  "/update-profile",
  authenticationMiddleware,
  validationMiddleware(updateProfileValidator),
  asyncHandler(ProfileUserService.updateProfile),
);
// upload profile picture route
ProfileUserController.post(
  "/upload-profile-picture",
  authenticationMiddleware,
  Multer().single("profilePicture"),
  asyncHandler(ProfileUserService.uploadProfilePicture),
);
// renew signed URL for profile picture route
ProfileUserController.get(
  "/renew-signed-url",
  authenticationMiddleware,
  validationMiddleware(renewSignedUrlValidator),
  asyncHandler(ProfileUserService.renewSignedUrl),
);
// delete user profile route
ProfileUserController.delete(
  "/delete-profile",
  authenticationMiddleware,
  asyncHandler(ProfileUserService.deleteProfile),
);
// create chat group route
ProfileUserController.post(
  "/create-group",
  authenticationMiddleware,
  validationMiddleware(createGroupValidator),
  asyncHandler(ProfileUserService.createChatGroup),
);
// search user route
ProfileUserController.get(
  "/search-user",
  authenticationMiddleware,
  validationMiddleware(searchUserValidator),
  asyncHandler(ProfileUserService.searchUser),
);
// list blocked users
ProfileUserController.get(
  "/list-blocked-users",
  authenticationMiddleware,
  asyncHandler(ProfileUserService.getAllBlockedUsers),
);
// block user route
ProfileUserController.post(
  "/block-user",
  authenticationMiddleware,
  validationMiddleware(blockUserValidator),
  asyncHandler(ProfileUserService.blockUser),
);
// unblock user route
ProfileUserController.post(
  "/unblock-user",
  authenticationMiddleware,
  validationMiddleware(unBlockUserValidator),
  asyncHandler(ProfileUserService.unblockUser),
);
// update email route
ProfileUserController.post(
  "/update-Email",
  authenticationMiddleware,
  asyncHandler(ProfileUserService.updateEmail),
);
// change email route
ProfileUserController.post(
  "/change-Email",
  authenticationMiddleware,
  validationMiddleware(changeEmailValidator),
  asyncHandler(ProfileUserService.changeEmail),
);
// deactivate account route
ProfileUserController.post(
  "/deactivate-account",
  authenticationMiddleware,
  asyncHandler(ProfileUserService.deactivateAccount),
);

export { ProfileUserController };
