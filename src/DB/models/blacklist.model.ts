import mongoose from "mongoose";
import { IBlacklistedToken } from "../../common";

const blacklistedTokensSchema = new mongoose.Schema<IBlacklistedToken>({
  accessTokenId: {
    type: String,
    required: true,
    index: { name: "idx_accessToken" },
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  refreshTokenId: {
    type: String,
    index: { name: "idx_refreshToken" },
  },
}, { timestamps: true });

export const BlacklistedTokenModel = mongoose.model<IBlacklistedToken>("BlacklistedTokens", blacklistedTokensSchema);