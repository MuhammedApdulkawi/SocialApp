import z from "zod";
import {
  blockUserValidator,
  changeEmailValidator,
  createGroupValidator,
  getProfileValidator,
  renewSignedUrlValidator,
  resendOTPValidator,
  searchUserValidator,
  unBlockUserValidator,
  updateProfileValidator,
} from "../validators";

export type getProfileValidatorType = z.infer<
  typeof getProfileValidator.params
>;
export type updateProfileValidatorType = z.infer<
  typeof updateProfileValidator.body
>;
export type blockUserValidatorType = z.infer<typeof blockUserValidator.body>;
export type unBlockUserValidatorType = z.infer<
  typeof unBlockUserValidator.body
>;
export type resendOTPValidatorType = z.infer<typeof resendOTPValidator.body>;
export type renewSignedUrlValidatorType = z.infer<
  typeof renewSignedUrlValidator.query
>;
export type createGroupValidatorType = z.infer<
  typeof createGroupValidator.body
>;
export type searchUserValidatorType = z.infer<typeof searchUserValidator.query>;
export type changeEmailValidatorType = z.infer<
  typeof changeEmailValidator.body
>;
