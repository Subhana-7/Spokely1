import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { inject, injectable } from "inversify";
import { TYPES } from "../types/types";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { IUserService } from "./interfaces/IUserService";
import { IUser } from "../models/user.model";
import {
  SignupDTO,
  LoginDTO,
  UserResponseDTO,
  changePasswordDTO,
  GoogleProfile,
} from "../dto/user.dto";
import { toUserResponseDTO } from "../mappers/user.mapper";
import { generateAccessToken, generateRefreshToken } from "../utilis/token";
import { IEmailService } from "./interfaces/IEmailService";

import {
  MESSAGES,
  PASSWORD_RULES,
  EMAIL_PROVIDER_CONSTANTS,
  EMAIL_TEMPLATES,
  USER_STRINGS,
  GOOGLE_AUTH_STRINGS,
  MENTOR_FILTER_STRINGS,
  HOME_STATS_STRINGS,
} from "../utilis/constants";

import { IAdminRepository } from "../repositories/interfaces/IAdminRepository";
import { toPublicMentorResponseDTO } from "../mappers/mentor.mapper";
import { MentorResponseDTO } from "../dto/mentor.dto";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
  ) {}

  /* ----------------------------------------
   * PASSWORD VALIDATION
   * ---------------------------------------- */
  private async passwordValidation(password: string) {
    if (!PASSWORD_RULES.REGEX.test(password)) {
      throw new Error(USER_STRINGS.PASSWORD.INVALID_FORMAT);
    }
  }

  /* ----------------------------------------
   * OTP GENERATION
   * ---------------------------------------- */
  public generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /* ----------------------------------------
   * EMAIL SENDER (OTP + FORGOT PASSWORD)
   * ---------------------------------------- */
  private async sendOTPEmail(
    to: string,
    otp: string,
    isForgotPassword = false,
  ) {
    const transporter = nodemailer.createTransport({
      service: EMAIL_PROVIDER_CONSTANTS.GMAIL,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const subject = isForgotPassword
      ? EMAIL_TEMPLATES.FORGOT_PASSWORD.SUBJECT
      : EMAIL_TEMPLATES.OTP.SUBJECT;

    const text = isForgotPassword
      ? EMAIL_TEMPLATES.FORGOT_PASSWORD.TEXT(otp)
      : EMAIL_TEMPLATES.OTP.TEXT(otp);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
  }

  /* ----------------------------------------
   * SIGNUP
   * ---------------------------------------- */
  async signup(data: SignupDTO): Promise<UserResponseDTO> {
    await this.passwordValidation(data.password);

    const existing = await this._userRepository.findByEmail(data.email);
    if (existing) throw new Error(MESSAGES.ERROR.EMAIL_EXISTS);

    const hashed = await bcrypt.hash(data.password, 10);
    const uniqueCode = await this.generateUniqueCode();

    const phoneNumber =
      data.phone !== undefined && data.phone !== null
        ? Number(data.phone)
        : undefined;

    const createPayload: Partial<IUser> = {
      name: data.name,
      email: data.email,
      password: hashed,
      uniqueCode,
      role: data.role,
      phone: phoneNumber,
    };

    const user = await this._userRepository.createUser(createPayload);
    return toUserResponseDTO(user!);
  }

  /* ----------------------------------------
   * LOGIN
   * ---------------------------------------- */
  async login(data: LoginDTO): Promise<{
    user: UserResponseDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this._userRepository.findByEmail(data.email);
    if (!user) throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);

    if (!user.password) throw new Error(MESSAGES.ERROR.ALREADY_VERIFIED);

    const match = await bcrypt.compare(data.password, user.password);
    if (!match) throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);

    return {
      user: toUserResponseDTO(user),
      accessToken: generateAccessToken({
        id: user._id,
        role: user.role,
        status: user.isBlocked,
      }),
      refreshToken: generateRefreshToken({
        id: user._id,
        role: user.role,
        status: user.isBlocked,
      }),
    };
  }

  /* ----------------------------------------
   * SEND OTP
   * ---------------------------------------- */
  async sendOtp(email: string): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this._userRepository.updateOTP(email, otp, expiresAt);
    await this._emailService.sendOTPEmail(email, otp, false);
  }

  /* ----------------------------------------
   * VERIFY OTP
   * ---------------------------------------- */
  async verifyOtp(email: string, code: string): Promise<{ message: string }> {
    const isValid = await this._userRepository.verifyOTP(email, code);
    if (!isValid) throw new Error(MESSAGES.ERROR.OTP_INVALID);

    return { message: MESSAGES.SUCCESS.OTP_VERIFIED };
  }

  /* ----------------------------------------
   * FORGOT PASSWORD OTP
   * ---------------------------------------- */
  async sendForgotPasswordOtp(email: string): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this._userRepository.updateForgotPasswordOTP(email, otp, expiresAt);
    await this._emailService.sendOTPEmail(email, otp, true);
  }

  async verifyForgotPasswordOtp(
    email: string,
    code: string,
  ): Promise<{ message: string }> {
    const isValid = await this._userRepository.verifyForgotPasswordOTP(
      email,
      code,
    );
    if (!isValid) throw new Error(MESSAGES.ERROR.OTP_INVALID);

    return { message: MESSAGES.SUCCESS.OTP_VERIFIED };
  }

  /* ----------------------------------------
   * RESET PASSWORD
   * ---------------------------------------- */
  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    if (!user.forgotPasswordOtp || !user.forgotPasswordOtp.verified) {
      throw new Error(USER_STRINGS.OTP.NOT_VERIFIED);
    }

    await this.passwordValidation(newPassword);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this._userRepository.updatePasswordAndClearOTP(email, hashedPassword);
  }

  /* ----------------------------------------
   * UPDATE ROLE
   * ---------------------------------------- */
  async updateRole(
    userId: string,
    role: "user" | "mentor",
  ): Promise<UserResponseDTO> {
    if (![USER_STRINGS.ROLE.USER, USER_STRINGS.ROLE.MENTOR].includes(role)) {
      throw new Error(MESSAGES.ERROR.INVALID_ROLE);
    }

    const updated = await this._userRepository.updateUserRole(userId, role);
    if (!updated) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    return toUserResponseDTO(updated);
  }

  /* ----------------------------------------
   * DASHBOARD HOME
   * ---------------------------------------- */
  async getHome(userId: string): Promise<UserResponseDTO> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error(HOME_STATS_STRINGS.NOT_FOUND);

    const stats = await this._userRepository.getUserStats(userId);

    const completionRate =
      stats.dailyTasksCompleted > 0
        ? Math.min(100, stats.sessionsDone * 5 + (user.levels ?? 0) * 10)
        : 0;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      uniqueCode: user.uniqueCode,
      profilePicture: user.profilePicture,
      sessionsDone: stats.sessionsDone,
      levels: user.levels,
      streak: user.streak,
      isBlocked: user.isBlocked,
      isVerified: user.isVerified,
      completionRate,
      mentorsSubscribed: stats.mentorsSubscribed,
      totalConnections: stats.totalConnections,
      dailyTasksCompleted: stats.dailyTasksCompleted,
    };
  }

  async getAllUsers(): Promise<UserResponseDTO[]> {
    const { results } = await this._userRepository.findAll();
    return results.length ? results.map(toUserResponseDTO) : [];
  }

  /* ----------------------------------------
   * UPDATE USER PROFILE
   * ---------------------------------------- */
  async updateUser(
    userId: string,
    data: Partial<UserResponseDTO>,
  ): Promise<UserResponseDTO> {
    const updated = await this._userRepository.updateUser(userId, data);
    if (!updated) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    return toUserResponseDTO(updated);
  }

  /* ----------------------------------------
   * UNIQUE CODE GENERATOR
   * ---------------------------------------- */
  async generateUniqueCode(): Promise<string> {
    let code = Math.random().toString(36).substring(2, 8).toUpperCase();
    while (await this._userRepository.findByUniqueCode(code)) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    return code;
  }

  /* ----------------------------------------
   * REFRESH TOKEN
   * ---------------------------------------- */
  async refreshToken(
    token: string,
  ): Promise<{ user: UserResponseDTO; accessToken: string }> {
    if (!token) throw new Error(MESSAGES.ERROR.INVALID_TOKEN);

    try {
      const payload = jwt.verify(token, process.env.REFRESH_SECRET!) as {
        id: string;
        role: string;
        status: boolean;
      };

      const user = await this._userRepository.findById(payload.id);
      if (!user) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

      return {
        user: toUserResponseDTO(user),
        accessToken: generateAccessToken({
          id: payload.id,
          role: payload.role,
          status: user.isBlocked,
        }),
      };
    } catch {
      throw new Error(MESSAGES.ERROR.INVALID_TOKEN);
    }
  }

  /* ----------------------------------------
   * CHANGE PASSWORD
   * ---------------------------------------- */
  async changePassword(data: changePasswordDTO): Promise<{ message: string }> {
    const user = await this._userRepository.findById(data.id);
    if (!user) throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);

    if (!data.currentPassword || !data.newPassword) {
      throw new Error(MESSAGES.ERROR.INVALID_INPUT);
    }

    await this.passwordValidation(data.newPassword);

    const match = await bcrypt.compare(data.currentPassword, user.password!);
    if (!match) throw new Error(MESSAGES.ERROR.PASSWORD_MISMATCH);

    const hashed = await bcrypt.hash(data.newPassword, 10);

    const updated = await this._userRepository.updatePassword(data.id, hashed);
    if (!updated) throw new Error(MESSAGES.ERROR.PASSWORD_NOT_CHANGED);

    return { message: MESSAGES.SUCCESS.PASSWORD_CHANGED };
  }

  /* ----------------------------------------
   * GOOGLE AUTH
   * ---------------------------------------- */
  async processGoogleAuth(
    profile: GoogleProfile,
  ): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    try {
      const email = profile?.emails?.[0]?.value;
      if (!email) throw new Error(USER_STRINGS.ERRORS.GOOGLE_EMAIL_MISSING);

      let user = await this._userRepository.findByEmail(email);

      if (!user) {
        const newUser = {
          name: profile.displayName || GOOGLE_AUTH_STRINGS.DEFAULT_PROFILE_NAME,
          email,
          googleId: profile.id,
          role: GOOGLE_AUTH_STRINGS.ROLE,
          isVerified: true,
          profilePicture:
            profile.photos?.[0]?.value ||
            GOOGLE_AUTH_STRINGS.DEFAULT_PROFILE_PICTURE,
          uniqueCode: await this.generateUniqueCode(),
          isGoogleUser: true,
        };
        user = await this._userRepository.createUser(newUser);
      } else {
        if (!user.isGoogleUser || !user.googleId) {
          const updated = await this._userRepository.updateUser(
            user._id.toString(),
            {
              googleId: profile.id,
              isGoogleUser: true,
              isVerified: true,
            },
          );
          if (updated) user = updated;
        }
      }

      if (!user) {
        throw Error(MESSAGES.ERROR.INTERNAL_ERROR);
      }

      const accessToken = generateAccessToken({
        id: user._id,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        id: user._id,
        role: user.role,
      });

      return {
        user: toUserResponseDTO(user),
        accessToken,
        refreshToken,
      };
    } catch (err: unknown) {
      console.error("processGoogleAuth error:", err);
      throw err;
    }
  }

  /* ----------------------------------------
   * GET ALL MENTORS LISTING
   * ---------------------------------------- */
  async listMentors({ page = 1, limit = 6, search = "" }): Promise<{
    mentors: MentorResponseDTO;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {
      "document.verificationStatus": MENTOR_FILTER_STRINGS.VERIFIED,
      isBlocked: MENTOR_FILTER_STRINGS.NOT_BLOCKED,
    };

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const { results, total } =
      await this._adminRepository.findAllMentorsPaginated(query, {
        page,
        limit,
      });

    return {
      mentors: results.map(toPublicMentorResponseDTO),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
