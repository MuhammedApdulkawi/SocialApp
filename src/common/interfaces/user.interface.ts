import { Document, Types } from "mongoose";
import {
  FRIENDSHIP_STATUS,
  OTP_TYPE,
  USER_GENDER,
  USER_PROVIDER,
  USER_ROLE,
} from "..";
import { JwtPayload } from "jsonwebtoken";

export interface IOTP {
  code: string;
  expireAt: Date;
  attempts: number;
  bannedUntil: Date | null;
  otpType: OTP_TYPE;
}
export interface IDeactivateAccount {
  deactivate: boolean;
  deactivatedAt?: Date;
}
export interface IUser extends Document<Types.ObjectId> {
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified?: boolean;
  password: string;
  DOB?: Date;
  role: USER_ROLE;
  provider: USER_PROVIDER;
  gender: USER_GENDER;
  googleId?: string;
  phoneNumber?: string;
  profileImage?: string;
  coverPic?: string;
  otps?: IOTP[];
  blockList?: Types.ObjectId[];
  enableTwoFactorAuth: boolean;
  deactivateAccount?: IDeactivateAccount;
}

export interface IEmailArgs {
  to: string;
  cc?: string;
  subject: string;
  content: string;
  attachments?: [];
}

export interface VerifyOTPArgs {
  inputOTP: string;
  storedOTP: IOTP;
  maxAttempts?: number;
  banMinutes?: number;
}

export interface IBlacklistedToken {
  accessTokenId: string;
  refreshTokenId?: string;
  expirationDate: Date;
}

export interface IRequest extends Request {
  loggedInUser: {
    user: IUser;
    token: JwtPayload;
    refreshTokenData?: JwtPayload;
  };
}

export interface IFriendship extends Document<Types.ObjectId> {
  requestFromId: Types.ObjectId;
  requestToId: Types.ObjectId;
  status: FRIENDSHIP_STATUS;
}

export interface IAuthPayload {
  email: string;
  given_name: string;
  email_verified: boolean;
  family_name: string;
  sub: string;
}
