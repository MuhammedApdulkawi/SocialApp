export const generateEmailContent = (
  type: string,
  userName: string,
  otp?: string,
  appName = "SocialApp",
) => {
  const name = userName;
  let subject = "";
  let content = "";

  switch (type) {
    case "welcome":
      subject = `Welcome to ${appName}!`;
      content = `
        <h2>Welcome ${name}!</h2>
        <p>Thanks for joining ${appName}. We're excited to have you on board.</p>
        <p>Feel free to explore our features and start connecting!</p>
      `;
      break;

    case "update":
      subject = "Your password has been updated";
      content = `
        <h2>Hello ${name},</h2>
        <p>This is to confirm that your password on ${appName} has been successfully updated.</p>
        <p>If you did not perform this action, please reset your password immediately.</p>
      `;
      break;

    case "verify":
      subject = "Verify your email";
      content = `
        <h2>Hello ${name},</h2>
        <p>You requested a new confirmation code for <strong>${appName}</strong>.</p>
        <p>Your confirmation code is:</p>
        <h3 style="color:#2E86C1;">${otp}</h3>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
      `;
      break;

    case "reset":
      subject = "Reset Password Code";
      content = `
        <h2>Hello ${name},</h2>
        <p>You requested a new password reset code for your <strong>${appName}</strong> account.</p>
        <p>Use the OTP below to reset your password:</p>
        <h3 style="color:#E74C3C;">${otp}</h3>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please secure your account immediately.</p>
      `;
      break;

    case "change-email":
      subject = "Confirm your email change";
      content = `
        <h2>Hello ${name},</h2>
        <p>We received a request to change the email on your <strong>${appName}</strong> account.</p>
        <p>Please verify this change using the OTP below:</p>
        <h3 style="color:#2E86C1;">${otp}</h3>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this email change, please ignore this email.</p>
      `;
      break;

    case "2fa-enabled":
      subject = "Two-factor authentication enabled";
      content = `
        <h2>Hello ${name},</h2>
        <p>This is a confirmation that two-factor authentication has been enabled on your <strong>${appName}</strong> account.</p>
        <p>If you did not perform this action, please secure your account immediately.</p>
      `;
      break;

    case "2fa-disabled":
      subject = "Two-factor authentication disabled";
      content = `
        <h2>Hello ${name},</h2>
        <p>This is a confirmation that two-factor authentication has been disabled on your <strong>${appName}</strong> account.</p>
        <p>If you did not perform this action, please secure your account immediately.</p>
      `;
      break;

    case "two-factor-auth":
      subject = "Your 2FA verification code";
      content = `
        <h2>Hello ${name},</h2>
        <p>Use the 2FA code below to complete your sign-in to <strong>${appName}</strong>:</p>
        <h3 style="color:#2E86C1;">${otp}</h3>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not attempt to sign in, please secure your account immediately.</p>
      `;
      break;

    case "account-deactivated":
      subject = "Your account has been deactivated";
      content = `
        <h2>Hello ${name},</h2>
        <p>This is to confirm that your <strong>${appName}</strong> account has been deactivated.</p>
        <p>If you did not request this action, please contact support immediately.</p>
      `;
      break;

    default:
      throw new Error("Invalid email type");
  }

  return { subject, content };
};

// export const signedInEmail = (name, ip, user_agent, region = 'Somewhere', country_name = 'Unknown') => {
//   let subject = 'New sign-in detected';
//   let content = `
//         <h2>Hello ${name},</h2>
//         <p>We noticed a new sign-in to your account from another device.</p>
//         <p>If this was you, no action is needed. Otherwise, please reset your password immediately.</p>
//         <p>Time of sign-in: ${new Date().toLocaleString()}</p>
//         <p>IP address: ${ip}</p>
//         <p>User agent: ${user_agent}</p>
//         <p>Location: <p>Location: ${region}, ${country_name}</p>
//       `;
//   return { subject, content };
// }
