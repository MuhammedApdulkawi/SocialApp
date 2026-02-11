import mongoose from "mongoose";

import {
  IUser,
  OTP_TYPE,
  USER_GENDER,
  USER_PROVIDER,
  USER_ROLE,
} from "../../common";
import { decrypt, encrypt, generateHash } from "../../utils";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      index: {
        unique: true,
        name: "idx_unique_email",
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
    },
    DOB: { type: Date },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: USER_ROLE.USER,
    },
    provider: {
      type: String,
      enum: Object.values(USER_PROVIDER),
      default: USER_PROVIDER.LOCAL,
    },
    gender: {
      type: String,
      enum: Object.values(USER_GENDER),
      default: USER_GENDER.OTHER,
    },
    googleId: String,
    phoneNumber: String,
    profileImage: String,
    coverPic: String,
    otps: [
      {
        otpType: {
          type: String,
          enum: Object.values(OTP_TYPE),
          required: true,
        },
        code: { type: String, required: true },
        expireAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        bannedUntil: { type: Date, default: null },
      },
      { _id: false },
    ],
    blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    enableTwoFactorAuth: {
      type: Boolean,
      default: false,
    },
    deactivateAccount: {
      deactivate: { type: Boolean, default: false },
      deactivatedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
((userSchema.methods = {
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  },
}),
  userSchema.virtual("fullName").get(function (this: IUser) {
    return `${this.firstName} ${this.lastName}`;
  }));
userSchema.index({ firstName: 1, lastName: 1 }, { unique: true });
userSchema.post(/^find/, function (doc) {
  if (!doc) return;

  if ((this as unknown as { op: string }).op == "find") {
    doc.forEach((user: IUser) => {
      if (user.phoneNumber) {
        user.phoneNumber = decrypt(user.phoneNumber as string);
      }
    });
  } else if (doc.phoneNumber) {
    doc.phoneNumber = decrypt(doc.phoneNumber as string);
  }
});

userSchema.pre("save", function () {
  if (this.isModified("phoneNumber") && this.phoneNumber) {
    this.phoneNumber = encrypt(this.phoneNumber as string);
  }
  if (this.isModified("password") && this.password) {
    this.password = generateHash(this.password as string);
  }
});

export const User = mongoose.model<IUser>("User", userSchema);
