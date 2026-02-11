import { NextFunction, Request, Response } from "express";

import { BlacklistRepository, UserRepository } from "../DB/repository";
import { BlacklistedTokenModel, User } from "../DB/models";
import { verifyToken } from "../utils/services/tokens.service.utils";
import { IRequest, IUser } from "../common";
import { UnauthorizedError } from "../utils";

const blacklistedRepo = new BlacklistRepository(BlacklistedTokenModel);
const userRepo = new UserRepository(User);

export const authenticationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization: accesstoken } = req.headers;

  if (!accesstoken) {
    throw new UnauthorizedError("please login first");
  }

  const token = accesstoken;

  const decodedToken = verifyToken(
    token,
    process.env.JWT_ACCESS_SECRET as string,
  );

  if (!decodedToken || !decodedToken.jti || !decodedToken._id) {
    throw new UnauthorizedError("invalid token payload");
  }

  const blacklistedTokens = await blacklistedRepo.findOneDocument({
    accessTokenId: decodedToken.jti,
  });

  if (blacklistedTokens) {
    throw new UnauthorizedError("token is blacklisted, please login again");
  }

  const user: IUser | null = await userRepo.findOneDocument(
    { _id: decodedToken._id },
    "-password",
  );

  if (!user) {
    throw new UnauthorizedError("please register first");
  }

  (req as unknown as IRequest).loggedInUser = {
    user,
    token: {
      tokenId: decodedToken.jti,
      expirationDate: decodedToken.exp,
    },
  };

  next();
};
