import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { BlacklistedTokenModel, User } from "../../../DB/models";
import { customAlphabet } from "nanoid";
import { JwtPayload } from "jsonwebtoken";
import { BlacklistRepository, UserRepository } from "../../../DB/repository";
import {
  changePasswordValidatorType,
  confirmEmailValidatorType,
  forgotPasswordValidatorType,
  generateTokens,
  IAuthPayload,
  IOTP,
  IRequest,
  logInValidatorType,
  logInWithOTPValidatorType,
  OTP_TYPE,
  resetPasswordValidatorType,
  signUpValidatorType,
  USER_PROVIDER,
} from "../../../common";
import {
  BadRequestError,
  compareHash,
  ConflictError,
  emitter,
  encrypt,
  generateEmailContent,
  generateHash,
  generateOTP,
  sendOTPService,
  SuccessResponse,
  verifyOTP,
} from "../../../utils";

class AuthUserServices {
  private uniqueString = customAlphabet("12345678abcdef", 5);
  private userRepo: UserRepository = new UserRepository(User);
  private blacklistRepo: BlacklistRepository = new BlacklistRepository(
    BlacklistedTokenModel,
  );

  signUpService = async (req: Request, res: Response, next: NextFunction) => {
    const {
      firstName,
      lastName,
      email,
      password,
      gender,
      confirmPassword,
      phoneNumber,
      DOB,
    }: signUpValidatorType = req.body;

    const isEmailExists = await this.userRepo.findOneDocument({ email });
    if (isEmailExists) {
      throw new ConflictError("Email Already Exists", { invalidData: email });
    }
    if (confirmPassword !== password) {
      throw new BadRequestError("Password and confirm password do not match");
    }
    const encryptedPhoneNumber = encrypt(phoneNumber as string);
    const { plainOTP, otpData } = generateOTP();
    const otp = {
      otpType: OTP_TYPE.VERIFY,
      ...otpData,
    };

    const user = await this.userRepo.createNewDocument({
      firstName,
      lastName,
      email,
      password,
      gender,
      phoneNumber: encryptedPhoneNumber,
      DOB,
      otps: [otp],
    });

    emitter.emit("sendEmail", {
      to: email,
      ...generateEmailContent("verify", `${firstName} ${lastName}`, plainOTP),
    });

    return res.json(
      SuccessResponse(
        "User Registered Successfully. Please verify your email.",
        201,
        user.toObject({ virtuals: true }),
      ),
    );
  };

  confirmEmailService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, otp }: confirmEmailValidatorType = req.body;
    if (!email || !otp) {
      throw new BadRequestError("Email and OTP are required");
    }
    const user = await this.userRepo.findOneDocument({
      email,
      isEmailVerified: false,
    });
    if (!user) {
      throw new BadRequestError("User Not Found or Email Already Verified");
    }
    const verifyOtp = user.otps?.find((o) => o.otpType === OTP_TYPE.VERIFY);

    const result = verifyOTP({
      inputOTP: otp,
      storedOTP: verifyOtp as IOTP,
    });

    if (!result.valid) {
      await user.save();
      throw new BadRequestError(result.reason || "Invalid OTP", {
        remainingSeconds:
          result.reason === "OTP_BANNED" ? result.remainingSeconds : undefined,
      });
    }

    const newUser = await this.userRepo.findOneAndUpdateDocument(
      { email },
      {
        $set: { isEmailVerified: true },
        $pull: { otps: { otpType: OTP_TYPE.VERIFY } },
      },
      { new: true },
    );

    return res.json(
      SuccessResponse("Email Verified Successfully", 200, newUser),
    );
  };

  loginService = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: logInValidatorType = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and Password are required");
    }

    const user = await this.userRepo.findOneDocument({ email });
    if (!user) {
      throw new BadRequestError("User Not Found");
    }
    const isValidPassword = compareHash(password, user.password);
    if (!isValidPassword) {
      throw new BadRequestError("Wrong Email or Password");
    }
    if (!user.isEmailVerified) {
      await this.userRepo.updateWithSave(
        { email },
        {
          otps: sendOTPService(user, OTP_TYPE.VERIFY).otps,
        },
      );
      throw new BadRequestError(
        "Email not verified. A new OTP has been sent to your email.",
      );
    }
    if (user.deactivateAccount?.deactivate) {
      await this.userRepo.updateWithSave(
        { email },
        {
          deactivateAccount: undefined,
        },
      );
    }
    if (!user.enableTwoFactorAuth) {
      const {
        accessToken,
        refreshToken,
      }: {
        accessToken: string;
        refreshToken: string;
      } = await generateTokens(user);
      return res.json(
        SuccessResponse("Login Successful", 200, {
          tokens: { accessToken, refreshToken },
        }),
      );
    } else {
      await this.userRepo.updateWithSave(
        { email },
        {
          otps: sendOTPService(user, OTP_TYPE.TWO_FACTOR_AUTH).otps,
        },
      );
      return res.json(SuccessResponse("OTP sent for 2FA", 200));
    }
  };

  logInWith2FAService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email, otp, password }: logInWithOTPValidatorType = req.body;

    if (!email || !otp || !password) {
      throw new BadRequestError("Email, Password and OTP are required");
    }
    const user = await this.userRepo.findOneDocument({ email });
    if (!user) {
      throw new BadRequestError("User Not Found");
    }
    const isValidPassword = compareHash(password, user.password);
    if (!isValidPassword) {
      throw new BadRequestError("Wrong Email or Password");
    }
    if (!user.enableTwoFactorAuth) {
      throw new BadRequestError("Two-factor authentication is not enabled");
    }

    const verifyOtp = user.otps?.find(
      (o) => o.otpType === OTP_TYPE.TWO_FACTOR_AUTH,
    );

    const result = verifyOTP({
      inputOTP: otp,
      storedOTP: verifyOtp as IOTP,
    });

    if (!result.valid) {
      await user.save();
      throw new BadRequestError(result.reason || "Invalid OTP", {
        remainingSeconds:
          result.reason === "OTP_BANNED" ? result.remainingSeconds : undefined,
      });
    }

    const filteredOtps = (user.otps as IOTP[]).filter(
      (o) => o.otpType !== OTP_TYPE.TWO_FACTOR_AUTH,
    );
    await this.userRepo.updateWithSave(
      { email },
      {
        otps: filteredOtps,
      },
    );

    const {
      accessToken,
      refreshToken,
    }: {
      accessToken: string;
      refreshToken: string;
    } = await generateTokens(user);

    return res.json(
      SuccessResponse("Login Successful", 200, {
        tokens: { accessToken, refreshToken },
      }),
    );
  };

  AuthWithGoogleService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        throw new BadRequestError("ID Token is required");
      }
      const client = new OAuth2Client(process.env.WEB_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new BadRequestError("Invalid Token - No Payload");
      }

      const { email, given_name, email_verified, family_name, sub } =
        payload as IAuthPayload;
      if (!email_verified) {
        throw new BadRequestError("Email Not Verified");
      }

      let user = await this.userRepo.findOneDocument({
        googleId: sub,
        email,
      });

      if (!user) {
        user = await this.userRepo.createNewDocument({
          firstName: given_name || "User",
          lastName: family_name || "",
          email,
          provider: USER_PROVIDER.GOOGLE,
          isEmailVerified: true,
          password: generateHash(this.uniqueString()), // Generate a random password since it's required, but user won't use it
          googleId: sub,
        });
      } else {
        user.email = email;
        user.firstName = given_name;
        user.lastName = family_name || "";
        await user.save();
      }
      emitter.emit("sendEmail", {
        to: email,
        ...generateEmailContent(
          "welcome",
          `${given_name} ${family_name || ""}`,
        ),
      });
      return res
        .status(201)
        .json(SuccessResponse("User Created Successfully", 201, user));
    } catch (error) {
      next(error);
    }
  };

  logoutService = async (req: Request, res: Response, next: NextFunction) => {
    const {
      token: { tokenId, expirationDate },
    } = (req as unknown as IRequest).loggedInUser;

    await this.blacklistRepo.createNewDocument({
      accessTokenId: tokenId,
      expirationDate,
    });
    return res.status(200).json(SuccessResponse("Logout Success", 200));
  };

  forgotPasswordService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const { email }: forgotPasswordValidatorType = req.body;
    if (!email) {
      throw new BadRequestError("Email is required");
    }
    const user = await this.userRepo.findOneDocument({
      email,
      provider: USER_PROVIDER.LOCAL,
    });
    if (!user) {
      throw new BadRequestError(
        "User with this email does not exist or is registered with a social provider",
      );
    }

    await this.userRepo.updateWithSave(
      { email },
      {
        otps: sendOTPService(user, OTP_TYPE.RESET).otps,
      },
    );
    return res.json(SuccessResponse("OTP has been sent to your email", 200));
  };

  resetPasswordService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      password,
      confirmPassword,
      email,
      otp,
    }: resetPasswordValidatorType = req.body;
    if (!email || !otp || !password || !confirmPassword) {
      throw new BadRequestError(
        "Email, OTP, Password and Confirm Password are required",
      );
    }
    const user = await this.userRepo.findOneDocument({
      email,
      provider: USER_PROVIDER.LOCAL,
    });
    if (!user) {
      throw new BadRequestError(
        "User with this email does not exist or is registered with a social provider",
      );
    }
    if (password !== confirmPassword) {
      throw new BadRequestError("Passwords do not match");
    }
    const verifyOtp = user.otps?.find((o) => o.otpType === OTP_TYPE.RESET);

    const result = verifyOTP({
      inputOTP: otp,
      storedOTP: verifyOtp as IOTP,
    });

    if (!result.valid) {
      await user.save();
      throw new BadRequestError(result.reason || "Invalid OTP", {
        remainingSeconds:
          result.reason === "OTP_BANNED" ? result.remainingSeconds : undefined,
      });
    }
    const filteredOtps = (user.otps as IOTP[]).filter(
      (otp) => otp.otpType !== OTP_TYPE.RESET,
    );
    await this.userRepo.updateWithSave(
      { email },
      {
        password,
        otps: filteredOtps,
      },
    );
    return res.json(SuccessResponse("Password Updated Successfully", 200));
  };

  changePasswordService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const {
      currentPassword,
      password,
      confirmPassword,
    }: changePasswordValidatorType = req.body;
    if (password !== confirmPassword) {
      throw new BadRequestError("Passwords do not match");
    }
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) {
      throw new BadRequestError("Invalid User ID");
    }
    if (!compareHash(currentPassword, user.password)) {
      throw new BadRequestError("Current Password is incorrect");
    }
    await this.userRepo.updateWithSave({ _id }, { password: password });
    return res.json(SuccessResponse("Password Updated Successfully", 200));
  };

  enableTwoFactorAuthService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const user = await this.userRepo.findOneDocument({
      _id,
      enableTwoFactorAuth: false,
    });
    if (!user) {
      throw new BadRequestError("Invalid User ID");
    }
    await this.userRepo.updateWithSave({ _id }, { enableTwoFactorAuth: true });
    emitter.emit("sendEmail", {
      to: user.email,
      ...generateEmailContent(
        "2fa-enabled",
        `${user.firstName} ${user.lastName}`,
      ),
    });
    return res.json(SuccessResponse("2FA Enabled Successfully", 200));
  };

  disableTwoFactorAuthService = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser;
    const user = await this.userRepo.findOneDocument({
      _id,
      enableTwoFactorAuth: true,
    });
    if (!user) {
      throw new BadRequestError("Two-factor authentication is not enabled or Invalid User ID");
    }
    const otps = (user.otps as IOTP[]).filter(
      (otp) => otp.otpType !== OTP_TYPE.TWO_FACTOR_AUTH,
    );
    await this.userRepo.updateWithSave(
      { _id },
      { enableTwoFactorAuth: false, otps },
    );
    emitter.emit("sendEmail", {
      to: user.email,
      ...generateEmailContent(
        "2fa-disabled",
        `${user.firstName} ${user.lastName}`,
      ),
    });
    return res.json(SuccessResponse("2FA Disabled Successfully", 200));
  };

  refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const {
      user: { _id },
      refreshTokenData: { tokenId, expirationDate },
    }: JwtPayload = (req as unknown as IRequest).loggedInUser;
    const user = await this.userRepo.findOneDocument({ _id });
    if (!user) {
      throw new BadRequestError("Invalid User ID");
    }
    const accessToken = (await generateTokens(user)).accessToken;

    await this.blacklistRepo.createNewDocument({
      accessTokenId: tokenId,
      expirationDate,
    });
    return res.json(
      SuccessResponse("Token Refreshed Successfully", 200, {
        tokens: { accessToken },
      }),
    );
  };
}

export default new AuthUserServices();
