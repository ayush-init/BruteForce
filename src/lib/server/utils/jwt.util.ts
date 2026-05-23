/**
 * JWT Utility - Token generation and verification
 * Handles access token and refresh token operations with proper error handling
 * Provides secure JWT-based authentication for the DSA Tracker application
 */

import jwt, { type SignOptions } from "jsonwebtoken";
import { ApiError } from "./ApiError";
import { AccessTokenPayload, RefreshTokenPayload } from '@/lib/server/types/auth.types';
import { ACCESS_TOKEN_EXPIRES, REFRESH_TOKEN_EXPIRES } from './token-config';

/**
 * Generate access token. Lifetime controlled by ACCESS_TOKEN_EXPIRES env (default "1d").
 * @param payload - User information to encode in token
 * @returns JWT access token string
 * @throws ApiError if token generation fails
 */
export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new ApiError(500, "ACCESS_TOKEN_SECRET environment variable is not set", [], "MISSING_SECRET");
    }

    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES as SignOptions['expiresIn'],
    });
  } catch (error: unknown) {
    throw new ApiError(500, "Failed to generate access token", [], "TOKEN_GENERATION_ERROR");
  }
};

/**
 * Generate refresh token. Lifetime controlled by REFRESH_TOKEN_EXPIRES env (default "7d").
 * @param payload - User information to encode in token
 * @returns JWT refresh token string
 * @throws ApiError if token generation fails
 */
export const generateRefreshToken = (
  payload: RefreshTokenPayload
): string => {
  try {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new ApiError(500, "REFRESH_TOKEN_SECRET environment variable is not set", [], "MISSING_SECRET");
    }

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES as SignOptions['expiresIn'],
    });
  } catch (error: unknown) {
    throw new ApiError(500, "Failed to generate refresh token", [], "TOKEN_GENERATION_ERROR");
  }
};

/**
 * Verify and decode access token
 * @param token - JWT access token to verify
 * @returns Decoded token payload
 * @throws ApiError if token is invalid or verification fails
 */
export const verifyAccessToken = (
  token: string
): AccessTokenPayload => {
  try {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new ApiError(500, "ACCESS_TOKEN_SECRET environment variable is not set", [], "MISSING_SECRET");
    }
    
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    return decoded;
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid or expired access token", [], "INVALID_TOKEN");
    }
    throw new ApiError(500, "Failed to verify access token", [], "TOKEN_VERIFICATION_ERROR");
  }
};

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded token payload
 * @throws ApiError if token is invalid or verification fails
 */
export const verifyRefreshToken = (
  token: string
): RefreshTokenPayload => {
  try {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new ApiError(500, "REFRESH_TOKEN_SECRET environment variable is not set", [], "MISSING_SECRET");
    }
    
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
    return decoded;
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, "Invalid or expired refresh token", [], "INVALID_TOKEN");
    }
    throw new ApiError(500, "Failed to verify refresh token", [], "TOKEN_VERIFICATION_ERROR");
  }
};

