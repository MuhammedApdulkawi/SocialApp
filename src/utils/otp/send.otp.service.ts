import { OTP_TYPE, IOTP, IUser } from "../../common";
import { generateEmailContent } from "../email/emailcontent.utils";
import { emitter } from "../email/sendemail.utils";
import { BadRequestError } from "../Error/exceptions.utils";
import { generateOTP } from "./otp.utils";

export function sendOTPService(user: IUser, otpType: OTP_TYPE) {
  if (
    user.otps?.find((o) => o.otpType === otpType && o.expireAt > new Date())
  ) {
    throw new BadRequestError(
      `An OTP for ${otpType} has already been sent. Please check your email.`,
    );
  }
  const filteredOtps = (user.otps as IOTP[]).filter(
    (otp) =>
      otp.otpType && otp.otpType !== otpType && otp.expireAt > new Date(),
  );

  const { plainOTP, otpData } = generateOTP();
  const otp = {
    otpType,
    ...otpData,
  };

  emitter.emit("sendEmail", {
    to: user.email,
    ...generateEmailContent(
      otpType.toString(),
      `${user.firstName} ${user.lastName}`,
      plainOTP,
    ),
  });

  const otps = [...filteredOtps, otp];
  return { otps };
}
