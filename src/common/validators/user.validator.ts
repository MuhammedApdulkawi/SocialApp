import z from "zod";
import { isValidObjectId } from "mongoose";
import { isAtLeast18 } from "../../utils";
import { USER_GENDER } from "../enum/enums";

/**
 * Common validation schemas
 */
const objectIdSchema = z
  .string()
  .refine((id) => isValidObjectId(id), "Invalid ObjectId");

const phoneNumberSchema = z
  .string()
  .refine(
    (num) => num.length >= 10 && num.length <= 15,
    "Phone number must be between 10 and 15 characters",
  );

const DOBSchema = z.coerce.date().refine((date) => isAtLeast18(date), {
  message: "User must be at least 18 years old",
  path: ["DOB"],
});

/**
 * User Authentication Validators
 */
export const userValidator = {
  body: z.object({
    firstName: z
      .string("First Name must be a string")
      .min(3, "First Name must be at least 3 characters"),
    lastName: z
      .string("Last Name must be a string")
      .min(3, "Last Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(20, "Password must be at most 20 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string(),
    DOB: DOBSchema,
    gender: z.enum(USER_GENDER),
    phoneNumber: phoneNumberSchema,
    userId: objectIdSchema.optional(),
    otp: z.string().length(5, "OTP must be 5 characters").optional(),
  }),
};

export const signUpValidator = {
  body: userValidator.body.superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password and confirm password do not match",
        path: ["confirmPassword"],
      });
    }
  }),
};

export const confirmEmailValidator = {
  body: userValidator.body.pick({ email: true, otp: true }),
};

export const logInValidator = {
  body: userValidator.body.pick({ email: true, password: true }),
};

export const logInWithOTPValidator = {
  body: userValidator.body.pick({ email: true, otp: true, password: true }),
};

export const forgotPasswordValidator = {
  body: userValidator.body.pick({ email: true }),
};

export const resetPasswordValidator = {
  body: userValidator.body
    .pick({ password: true, confirmPassword: true, otp: true, email: true })
    .superRefine((val, ctx) => {
      if (val.password !== val.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password and confirm password do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};

export const changePasswordValidator = {
  body: userValidator.body
    .pick({ password: true, confirmPassword: true })
    .extend({
      currentPassword: userValidator.body.shape.password,
    })
    .superRefine((val, ctx) => {
      if (val.password !== val.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password and confirm password do not match",
          path: ["confirmPassword"],
        });
      }
    }),
};
