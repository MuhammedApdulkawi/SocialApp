import { Request, Response, NextFunction } from "express";
import { BadRequestError, verifyToken } from "../utils";
import { BlacklistRepository, UserRepository } from "../DB/repository";
import { BlacklistedTokenModel, User } from "../DB/models";
import { IRequest } from "../common";

const blacklistedRepo = new BlacklistRepository(BlacklistedTokenModel);
const userRepo = new UserRepository(User);
export const verifyRefreshTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { authorization: refreshtoken } = req.headers;

  if (!refreshtoken) {
    throw new BadRequestError("Insert a refresh token");
  }

  let refreshTokenData;
  refreshTokenData = verifyToken(
    refreshtoken,
    process.env.JWT_REFRESH_SECRET as string,
  );

  if (!refreshTokenData?.jti) {
    throw new BadRequestError("Invalid refresh token");
  }

  const revokedToken = await blacklistedRepo.findOneDocument({
    refreshTokenId: refreshTokenData.jti,
  });
  if (revokedToken) {
    throw new BadRequestError("Refresh token has been revoked");
  }

  const user = await userRepo.findOneDocument({ _id: refreshTokenData._id });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  if (!(req as unknown as IRequest).loggedInUser) {
    (req as unknown as IRequest).loggedInUser = {} as IRequest["loggedInUser"];
  }

  (req as unknown as IRequest).loggedInUser.user = user;
  (req as unknown as IRequest).loggedInUser.refreshTokenData = {
    tokenId: refreshTokenData.jti,
    expirationDate: refreshTokenData.exp,
  };
  next();
};
