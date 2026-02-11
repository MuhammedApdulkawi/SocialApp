import { hashSync, compareSync } from "bcrypt";
import { customAlphabet } from "nanoid";
import { VerifyOTPArgs } from "../../common";
const uniqueString = customAlphabet("12345678abcdef", 5);

export const generateOTP = ({
  expireMinutes = +(process.env.OTP_EXPIRE_MINUTES as string),
  saltRounds = +(process.env.SALT_ROUNDS as string),
} = {}) => {
  const plainOTP = uniqueString();
  return {
    plainOTP,
    otpData: {
      code: hashSync(plainOTP, saltRounds),
      expireAt: new Date(Date.now() + expireMinutes * 60 * 1000),
      attempts: 0,
      bannedUntil: null,
    },
  };
};

export const verifyOTP = ({
  inputOTP,
  storedOTP,
  maxAttempts = +(process.env.OTP_MAX_ATTEMPTS as string),
  banMinutes = +(process.env.OTP_BAN_MINUTES as string),
}: VerifyOTPArgs) => {
  if (!storedOTP) return { valid: false, reason: "OTP_NOT_FOUND" };

  if (storedOTP.expireAt.getTime() < Date.now())
    return { valid: false, reason: "OTP_EXPIRED" };

  if (storedOTP.bannedUntil && storedOTP.bannedUntil.getTime() <= Date.now()) {
    storedOTP.bannedUntil = null;
    storedOTP.attempts = 0;
  }

  if (storedOTP.bannedUntil && storedOTP.bannedUntil.getTime() > Date.now()) {
    const remainingSeconds = Math.ceil(
      (storedOTP.bannedUntil.getTime() - Date.now()) / 1000,
    );

    return { valid: false, reason: "OTP_BANNED", remainingSeconds };
  }

  const isValid = compareSync(inputOTP, storedOTP.code);

  if (!isValid) {
    storedOTP.attempts += 1;

    if (storedOTP.attempts >= maxAttempts) {
      storedOTP.bannedUntil = new Date(Date.now() + banMinutes * 60 * 1000);

      return { valid: false, reason: "OTP_BANNED" };
    }

    return { valid: false, reason: "OTP_INVALID" };
  }

  storedOTP.code = undefined as any;
  storedOTP.expireAt = undefined as any;
  storedOTP.attempts = 0;
  storedOTP.bannedUntil = null;

  return { valid: true };
};
