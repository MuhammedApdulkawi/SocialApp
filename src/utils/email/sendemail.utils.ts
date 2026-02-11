import { EventEmitter } from "node:events";
import nodemailer from "nodemailer";
import { IEmailArgs } from "../../common";
export const emitter = new EventEmitter();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  content,
  attachments = [],
}: IEmailArgs) => {
  if (!to || !subject || !content) {
    throw new Error("Missing required email fields");
  }

  const info = await transporter.sendMail({
    from: `"No Reply" <${process.env.USER_EMAIL}>`,
    to,
    subject,
    html: content,
    attachments,
  });

  return info.messageId;
};

emitter.on("sendEmail", (args: IEmailArgs) => {
  sendEmail(args);
});
