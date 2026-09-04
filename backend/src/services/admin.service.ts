import bcrypt from "bcrypt";
import { IAdminRepository } from "../repositories/interfaces/IAdminRepository";
import { IEmailService } from "./interfaces/IEmailService";
import { inject, injectable } from "inversify";
import { TYPES } from "../types/types";
import { IAdminService } from "./interfaces/IAdminService";
import { IMentor } from "../models/mentor.model";
import { generateAccessToken, generateRefreshToken } from "../utilis/token";
import { mapAdminToDto, mapUserToSummaryDto } from "../mappers/admin.mapper";
import { AdminResponseDto, UserSummaryDto } from "../dto/admin.dto";
import {
  MESSAGES,
  REPORT_TYPES,
  ReportType,
  REPORT_COLUMNS,
} from "../utilis/constants";
import { toUserResponseDTO } from "../mappers/user.mapper";

import {
  ACCOUNT_STATUS,
  SESSION_STATUS,
  PAYMENT_STATUS,
  CONNECTION_STATUS,
  SUBSCRIPTION_STATUS,
  QUERY_STATUS,
  SORT_BY,
  VERIFICATION_STATUS,
} from "../utilis/constants";

import { ISessionRepository } from "../repositories/interfaces/ISessionsRepository";
import { ISession } from "../models/sessions.model";

import User from "../models/user.model";
import Mentor from "../models/mentor.model";
import Session from "../models/sessions.model";
import Payment from "../models/payment.model";
import Wallet from "../models/wallet.model";
import Subscription from "../models/subscription.modal";
import { DailyTaskModel } from "../models/daily.task.model";
import Connection from "../models/connections.model";
import PDFDocument from "pdfkit";
import { Writable } from "stream";

type ExportParams = {
  type?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  status?: string | undefined;
  mentorId?: string | undefined;
};

import { IPaymentRepository } from "../repositories/interfaces/IPaymentRepository";
import { IDailyTaskRepository } from "../repositories/interfaces/IDailyTaskRepository";
import { ISessionService } from "./interfaces/ISessionService";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepository: IAdminRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.ISessionRepository)
    private _sessionRepository: ISessionRepository,
    @inject(TYPES.IPaymentRepository)
    private _paymentRepository: IPaymentRepository,
    @inject(TYPES.IDailyTaskRepository)
    private _dailyTaskRepository: IDailyTaskRepository,
    @inject(TYPES.ISessionService) private _sessionService: ISessionService
  ) {}

  /* ============================================================
     LOGIN
  ============================================================ */
  async login(
    email: string,
    rawPassword: string
  ): Promise<{
    admin: AdminResponseDto;
    accessToken: string;
    refreshToken: string;
  } | null> {
    const admin = await this._adminRepository.findByEmail(email);
    if (!admin) throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);

    const match = await bcrypt.compare(rawPassword, admin.password);
    
    if (!match) throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);

    return {
      admin: mapAdminToDto(admin),
      accessToken: generateAccessToken({ id: admin._id, role: admin.role }),
      refreshToken: generateRefreshToken({ id: admin._id, role: admin.role }),
    };
  }

  /* ============================================================
     USER STATUS UPDATE
  ============================================================ */
  async updateUserStatus(userId: string, status: string) {
    const actions: Record<string, () => Promise<any>> = {
      [ACCOUNT_STATUS.UNBLOCKED]: () =>
        this._adminRepository.unblockUser(userId),
      [ACCOUNT_STATUS.BLOCKED]: () => this._adminRepository.blockUser(userId),
    };

    const action = actions[status];
    if (!action) throw new Error(MESSAGES.ERROR.INVALID_INPUT);

    const updatedUser = await action();

    const successMessage =
      status === ACCOUNT_STATUS.UNBLOCKED
        ? MESSAGES.SUCCESS.USER_UNBLOCKED
        : MESSAGES.SUCCESS.USER_BLOCKED;

    return {
      message: successMessage,
      user: mapUserToSummaryDto(updatedUser),
    };
  }

  /* ============================================================
     MENTOR STATUS UPDATE
  ============================================================ */
  async updateMentorStatus(mentorId: string, status: string) {
    const actions: Record<string, () => Promise<any>> = {
      [ACCOUNT_STATUS.UNBLOCKED]: () =>
        this._adminRepository.unblockMentor(mentorId),
      [ACCOUNT_STATUS.BLOCKED]: () =>
        this._adminRepository.blockMentor(mentorId),
    };

    const action = actions[status];
    if (!action) throw new Error(MESSAGES.ERROR.INVALID_INPUT);

    const mentor = await action();

    const successMessage =
      status === ACCOUNT_STATUS.UNBLOCKED
        ? MESSAGES.SUCCESS.MENTOR_UNBLOCKED
        : MESSAGES.SUCCESS.MENTOR_BLOCKED;

    return {
      message: successMessage,
      user: mentor,
    };
  }

  /* ============================================================
     MENTOR FETCH/APPROVAL
  ============================================================ */
  async getMentor(mentorId: string): Promise<IMentor[] | null> {
    return this._adminRepository.getMentor(mentorId);
  }

  async approveMentor(mentorId: string): Promise<IMentor | null> {
    const mentor = await this._adminRepository.getMentor(mentorId);
    const email = mentor?.[0]?.email;

    if (email)
      await this._emailService.sendVerificationUpdateEmail(email, "approved");

    return this._adminRepository.updateMentor(mentorId);
  }

  async rejectMentor(
    mentorId: string,
    reason: string
  ): Promise<IMentor | null> {
    const mentor = await this._adminRepository.getMentor(mentorId);
    const email = mentor?.[0]?.email;

    if (email)
      await this._emailService.sendVerificationUpdateEmail(email, "rejected");

    return this._adminRepository.updateMentorRejection(mentorId, reason);
  }

  /* ============================================================
     USER LIST PAGINATION
  ============================================================ */
  async getAllUsersWithQuery(params: {
    page?: number;
    limit?: number;
    search?: string;
    level?: string;
    minSessions?: number;
    maxSessions?: number;
    minMentors?: number;
    maxMentors?: number;
    isBlocked?: boolean;
  }): Promise<{ users: UserSummaryDto[]; total: number }> {
    const { users, total } = await this._adminRepository.findAllUsersWithQuery(
      params
    );

    return { users: users.map(mapUserToSummaryDto), total };
  }

  /* ============================================================
     MENTOR LIST QUERY
  ============================================================ */
  async getAllMentorsWithQuery(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string | (typeof SORT_BY)[keyof typeof SORT_BY];
    verificationStatus?: (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];
    isBlocked?: boolean;
  }): Promise<{ mentors: IMentor[]; total: number }> {
    return this._adminRepository.findAllMentorsWithQuery(params);
  }

  /* ============================================================
     ADMIN DASHBOARD HOME
  ============================================================ */
  async getHome(adminId: string): Promise<AdminResponseDto | null> {
    const admin = await this._adminRepository.findById(adminId);
    return admin ? mapAdminToDto(admin) : null;
  }

  /* ============================================================
     DASHBOARD STATS
  ============================================================ */
  async getDashboardStats() {
    const [
      totalUsers,
      totalMentors,
      totalSessions,
      completedPayments,
      totalConnections,
      totalSubscriptions,
      totalDailyTasks,
      wallets,
    ] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      Mentor.countDocuments({ isVerified: true }),
      Session.countDocuments({}),
      Payment.countDocuments({ status: PAYMENT_STATUS.COMPLETED }),
      Connection.countDocuments({ status: CONNECTION_STATUS.ACCEPTED }),
      Subscription.countDocuments({ status: SUBSCRIPTION_STATUS.ACTIVE }),
      DailyTaskModel.countDocuments({}),
      Wallet.aggregate([
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
    ]);

    const walletBalance = wallets[0]?.total || 0;

    const paymentSum = await Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    return {
      totalUsers,
      totalMentors,
      totalSessions,
      totalPayments: paymentSum[0]?.totalAmount || 0,
      totalConnections,
      totalSubscriptions,
      totalDailyTasks,
      walletBalance,
    };
  }

  /* ============================================================
     ADMIN – SESSION FILTERING / SEARCH
  ============================================================ */
  async getAllSessionsAdmin(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<{ sessions: ISession[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = QUERY_STATUS.ALL,
      type = QUERY_STATUS.ALL,
    } = params;

    const query: any = {};

    if (status !== QUERY_STATUS.ALL) {
      query.status = status;
    }

    if (type !== QUERY_STATUS.ALL) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: "i" } },
        { "createdBy.name": { $regex: search, $options: "i" } },
        { "createdBy.email": { $regex: search, $options: "i" } },
      ];
    }

    const { sessions, total } =
      await this._sessionRepository.findSessionsPaginated(query, {
        page,
        limit,
      });

    return { sessions, total };
  }

  private async getReportData(params: ExportParams): Promise<unknown[]> {
    const { type, startDate, endDate, status, mentorId } = params;
    const reportType = type as ReportType;

    let data: any[] = [];

    const today = new Date();
    const dayStart = new Date(today.setHours(0, 0, 0, 0));

    switch (reportType) {
      case REPORT_TYPES.SESSION:
        const sessionsResult = await this._sessionService.getAllSessionsAdmin();
        data = sessionsResult || [];
        break;

      case REPORT_TYPES.MENTOR:
        data = (await this._adminRepository.findAllMentors()) || [];
        break;

      case REPORT_TYPES.USER: {
        const users = await this._adminRepository.findAllUsers();
        data = users ? users.map((u) => toUserResponseDTO(u)) : [];
        break;
      }

      case REPORT_TYPES.DAILY_TASK:
        data = (await this._dailyTaskRepository.findAllByDate(dayStart)) || [];
        break;

      case REPORT_TYPES.PAYMENT:
        data = (await this._paymentRepository.findAllPayment()) || [];
        break;

      default:
        data = [];
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start || end) {
      data = data.filter((item: any) => {
        const dateField =
          item.createdAt || item.updatedAt || item.date || item.timestamp;
        if (!dateField) return true;
        const d = new Date(dateField);
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      });
    }

    return data;
  }

  /* ============================================================
   Export: PDF (returns Buffer + filename)
   ============================================================ */
  async exportReportPdf(
    params: ExportParams
  ): Promise<{ buffer: Buffer; filename: string; type: string }> {
    const getValue = (obj: any, path: string) => {
      return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
    };

    const data = await this.getReportData(params);
    const reportType = params.type || "report";
    const filename = `${reportType}-report.pdf`;

    const doc = new PDFDocument({ margin: 35, size: "A4" });
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, _enc, next) {
        chunks.push(Buffer.from(chunk));
        next();
      },
    });

    doc.pipe(writable);

    doc.fillColor("#000000");
    doc
      .fontSize(18)
      .text(`${reportType.toUpperCase()} REPORT`, { align: "center" });
    doc.moveDown();

    if (!data || data.length === 0) {
      doc.fillColor("#000000");
      doc.fontSize(12).text("No data available.");
      doc.end();
    } else {
      const columns = REPORT_COLUMNS[reportType];
      const tableStartX = 35;
      let y = doc.y + 10;

      const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

      const line = (x1: number, y1: number, x2: number, y2: number) => {
        doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
      };

      const formatValue = (v: any): string => {
        if (v == null) return "";
        if (Array.isArray(v)) return v.join(", ");
        if (v instanceof Date) return v.toISOString().split("T")[0];
        if (typeof v === "object") return "";
        return String(v);
      };

      // ===============================
      //   HEADER ROW + VERTICAL LINES
      // ===============================
      doc.rect(tableStartX, y, tableWidth, 22).fill("#f0f0f0").stroke();

      doc.fillColor("#000000");
      doc.font("Helvetica-Bold").fontSize(11);

      let x = tableStartX;
      for (const col of columns) {
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });

        line(x, y, x, y + 22);
        x += col.width;
      }

      line(tableStartX + tableWidth, y, tableStartX + tableWidth, y + 22);
      line(tableStartX, y + 22, tableStartX + tableWidth, y + 22);

      y += 22;

      // ==========================
      //   DATA ROWS (WITH BORDERS)
      // ==========================
      doc.fillColor("#000000");
      doc.font("Helvetica").fontSize(10);

      for (const item of data) {
        let rowHeight = 18;

        columns.forEach((col) => {
          const rawValue = getValue(item, col.key);
          const text = formatValue(rawValue);

          const h = doc.heightOfString(text, { width: col.width - 8 });
          rowHeight = Math.max(rowHeight, h + 8);
        });

        doc.rect(tableStartX, y, tableWidth, rowHeight).stroke();

        let colX = tableStartX;

        for (const col of columns) {
          const rawValue = getValue(item, col.key);
          const text = formatValue(rawValue);

          doc.text(text, colX + 4, y + 4, { width: col.width - 8 });

          line(colX, y, colX, y + rowHeight);
          colX += col.width;
        }

        line(
          tableStartX + tableWidth,
          y,
          tableStartX + tableWidth,
          y + rowHeight
        );

        y += rowHeight;

        if (y > 760) {
          doc.addPage();
          doc.fillColor("#000000");
          doc.font("Helvetica").fontSize(10);
          y = doc.y + 10;
        }
      }

      line(tableStartX, y, tableStartX + tableWidth, y);
    }

    doc.end();

    await new Promise<void>((resolve, reject) => {
      writable.on("finish", resolve);
      writable.on("error", reject);
    });

    return { buffer: Buffer.concat(chunks), filename, type: reportType };
  }
}
