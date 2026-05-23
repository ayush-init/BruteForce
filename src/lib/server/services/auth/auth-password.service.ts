import prisma from '@/lib/server/config/prisma';
import { generateOTP, saveOTP, validateOTP } from '@/lib/server/utils/otp.util';
import { sendOTPEmail, sendPasswordChangedEmail } from '@/lib/server/utils/email.util';
import { validateEmail } from '@/lib/server/utils/emailValidation.util';
import { validatePasswordForAuth } from '@/lib/server/utils/passwordValidator.util';
import { hashPassword, comparePassword } from '@/lib/server/utils/password.util';
import { ApiError } from '@/lib/server/utils/ApiError';

export const sendPasswordResetOTP = async (email: string) => {
  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Validate email domain — domain rejection is fine to surface; it reveals
  // nothing about specific users (anyone could check the domain via DNS).
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Same response for both registered and non-existent users — prevents
  // attackers from enumerating valid student/admin emails.
  const genericResponse = {
    message: 'If this email is registered, a verification code has been sent.',
  };

  // Check if user exists (student or admin) — only need `name` for the email greeting,
  // matching shapes lets TypeScript narrow the union cleanly.
  let user = await prisma.student.findUnique({
    where: { email },
    select: { name: true },
  });
  if (!user) {
    user = await prisma.admin.findUnique({
      where: { email },
      select: { name: true },
    });
  }

  // Silently succeed for non-existent users — no DB write, no email, no OTP.
  // Small delay so timing can't distinguish registered vs unregistered email.
  if (!user) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return genericResponse;
  }

  // Generate, save, and email OTP
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendOTPEmail(email, otp, user.name);

  // OTP is NEVER returned in the response — caller must retrieve it from email.
  return genericResponse;
};

export const verifyOTP = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Verify OTP
  const isValidOTP = await validateOTP(email, otp);

  if (!isValidOTP) {
    throw new ApiError(400, 'Invalid or expired OTP', [], 'INVALID_OTP');
  }

  return {
    message: 'OTP verified successfully',
    valid: true
  };
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  if (!email || !otp || !newPassword) {
    throw new ApiError(400, 'Email, OTP, and new password are required');
  }

  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    throw new ApiError(400, emailValidation.error);
  }

  // Validate password strength
  validatePasswordForAuth(newPassword);

  // Verify OTP — but DON'T mark it as used yet. The OTP should only be
  // consumed when the password actually changes. If we mark it here and
  // then the new password fails the "same as current" check below, the
  // user would be forced to request a fresh OTP just because they picked
  // their old password — which is a bad UX and burns email/SES quota.
  const isValidOTP = await validateOTP(email, otp);

  if (!isValidOTP) {
    throw new ApiError(400, 'Invalid or expired OTP', [], 'INVALID_OTP');
  }

  // Find user
  let user = null;
  user = await prisma.student.findUnique({ where: { email } });

  let userType = '';
  if (user) {
    userType = 'student';
  } else {
    user = await prisma.admin.findUnique({ where: { email } });
    if (user) {
      userType = 'admin';
    }
  }

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if new password is same as current password. If it is, throw
  // BEFORE we touch the OTP — so the OTP stays valid and the user can
  // simply retry with a different password (still within the 10-min window).
  if (user.password_hash) {
    const isSamePassword = await comparePassword(newPassword, user.password_hash);
    if (isSamePassword) {
      throw new ApiError(
        400,
        'New password cannot be the same as your current password',
        [],
        'SAME_AS_OLD_PASSWORD'
      );
    }
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Atomically: mark OTP as used AND update the password.
  // Wrapping both in a single transaction guarantees that the OTP is only
  // consumed if the password write succeeds — if either fails the whole
  // thing rolls back and the OTP remains usable.
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetOTP.updateMany({
      where: { email, is_used: false },
      data: { is_used: true },
    });

    if (userType === 'student') {
      await tx.student.update({
        where: { email },
        data: { password_hash },
      });
    } else {
      await tx.admin.update({
        where: { email },
        data: { password_hash },
      });
    }
  });

  // Send confirmation email (non-blocking — failure doesn't affect the password reset itself)
  await sendPasswordChangedEmail(email, user.name);

  return {
    message: 'Password reset successful. You can now login with your new password.'
  };
};
