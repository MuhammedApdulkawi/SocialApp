import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../utils/services/tokens.service.utils";
import { SignOptions } from "jsonwebtoken";
import { IUser } from "./interfaces/user.interface";

export const generateTokens = async (user: IUser) => {
  const accessTokenJwtId = uuidv4();
  const refreshTokenJwtId = uuidv4();

  const accessToken = generateToken(
    {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
      jwtid: accessTokenJwtId,
    },
  );

  const refreshToken = generateToken(
    {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
      jwtid: refreshTokenJwtId,
    },
  );

  return { accessToken, refreshToken, accessTokenJwtId, refreshTokenJwtId };
};
