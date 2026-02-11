import { Router } from "express";

import authUserService from "../service/auth.user.service";
import {
  authenticationMiddleware,
  validationMiddleware,
  verifyRefreshTokenMiddleware,
} from "../../../middleware";
import { asyncHandler } from "../../../utils";
import { changePasswordValidator, confirmEmailValidator, forgotPasswordValidator, logInValidator, logInWithOTPValidator, resetPasswordValidator, signUpValidator } from "../../../common";

const authUserController = Router();

authUserController.post(
  "/signup",
  validationMiddleware(signUpValidator),
  asyncHandler(authUserService.signUpService),
);
authUserController.post(
  "/confirm-email",
  validationMiddleware(confirmEmailValidator),
  asyncHandler(authUserService.confirmEmailService),
);
authUserController.post(
  "/login",
  validationMiddleware(logInValidator),
  asyncHandler(authUserService.loginService),
);
authUserController.post(
  "/logout",
  authenticationMiddleware,
  asyncHandler(authUserService.logoutService),
);
authUserController.post(
  "/auth-gmail",
  asyncHandler(authUserService.AuthWithGoogleService),
);
authUserController.put(
  "/reset-password",
  validationMiddleware(resetPasswordValidator),
  asyncHandler(authUserService.resetPasswordService),
);
authUserController.post(
  "/forgot-password",
  validationMiddleware(forgotPasswordValidator),
  asyncHandler(authUserService.forgotPasswordService),
);
authUserController.post(
  "/change-password",
  authenticationMiddleware,
  validationMiddleware(changePasswordValidator),
  asyncHandler(authUserService.changePasswordService),
);
authUserController.post(
  "/enable-2fa",
  authenticationMiddleware,
  asyncHandler(authUserService.enableTwoFactorAuthService),
);
authUserController.post(
  "/disable-2fa",
  authenticationMiddleware,
  asyncHandler(authUserService.disableTwoFactorAuthService),
);
authUserController.post(
  "/login-2fa",
  validationMiddleware(logInWithOTPValidator),
  asyncHandler(authUserService.logInWith2FAService),
);
authUserController.post(
  "/refresh-token",
  verifyRefreshTokenMiddleware,
  asyncHandler(authUserService.refreshAccessToken),
);

export { authUserController };
