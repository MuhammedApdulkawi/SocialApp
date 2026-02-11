import { z } from "zod";
import { changePasswordValidator, confirmEmailValidator, forgotPasswordValidator, logInValidator, logInWithOTPValidator, resetPasswordValidator, signUpValidator } from "../validators";

export type signUpValidatorType = z.infer<typeof signUpValidator.body>;
export type confirmEmailValidatorType = z.infer<typeof confirmEmailValidator.body>;
export type logInValidatorType = z.infer<typeof logInValidator.body>;
export type logInWithOTPValidatorType = z.infer<typeof logInWithOTPValidator.body>;
export type forgotPasswordValidatorType = z.infer<typeof forgotPasswordValidator.body>;
export type resetPasswordValidatorType = z.infer<typeof resetPasswordValidator.body>;
export type changePasswordValidatorType = z.infer<typeof changePasswordValidator.body>;
