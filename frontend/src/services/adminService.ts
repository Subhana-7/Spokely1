import API from "../api/axios.instance";
import { ADMIN_ROUTES as R } from "../constants/routes";

export interface AdminSessionParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  type: string;
}

export interface UserStatus {
  id: string;
  status: "blocked" | "unBlocked";
}

export interface MentorStatus {
  id: string;
  status: "blocked" | "unBlocked";
}

// --- Authentication ---
export const adminLogin = (email: string, password: string) =>
  API.post(`${R.base}${R.login}`, { email, password });

export const logout = () => API.post(`${R.base}${R.logout}`);

// --- Users ---
export const getAllUsers = (params: Record<string, any> = {}) =>
  API.get(`${R.base}${R.users}`, { params });

export const updateUserStatus = (
  userId: string,
  status: "blocked" | "unBlocked"
) => API.patch(`${R.base}${R.users}/${userId}${R.status}`, { status });

export const blockUser = (userId: string) =>
  updateUserStatus(userId, "blocked");
export const unblockUser = (userId: string) =>
  updateUserStatus(userId, "unBlocked");

// --- Mentors ---
export const getAllMentors = (params: Record<string, any> = {}) =>
  API.get(`${R.base}${R.mentors}`, { params });

export const updateMentorStatus = (
  mentorId: string,
  status: "blocked" | "unBlocked"
) => API.patch(`${R.base}${R.mentors}/${mentorId}${R.status}`, { status });

export const blockMentor = (mentorId: string) =>
  updateMentorStatus(mentorId, "blocked");
export const unblockMentor = (mentorId: string) =>
  updateMentorStatus(mentorId, "unBlocked");

export const mentorVerification = (mentorId: string) =>
  API.get(`${R.base}${R.mentors}${R.verification}/${mentorId}`);

export const approveMentor = (mentorId: string) =>
  API.patch(`${R.base}${R.mentors}${R.approve}/${mentorId}`);

export const rejectMentor = (mentorId: string, rejectionReason: string) =>
  API.post(`${R.base}${R.mentors}${R.reject}/${mentorId}`, { rejectionReason });

// --- Sessions ---
export const adminSessionListing = (params: AdminSessionParams) =>
  API.get(`${R.base}${R.sessions}`, { params });

export const getAdminHomeStats = () => API.get(`${R.base}${R.home}`);

// export const getReports = (params: Record<string, any>) =>
//   API.get(`${R.base}${R.reports}`, { params });

export const paymentDetails = (id: string) =>
  API.get(`${R.base}${R.payment}/${id}`);

export const getPayments = () => {
  return API.get(`${R.base}${R.payments}`);
};

// --- Daily Tasks ---
export const getAdminTasks = (params: {
  search?: string;
  topic?: string;
  page?: number;
  limit?: number;
}) => API.get(`${R.base}${R.tasks}`, { params });

export const getAdminTaskById = (id: string) =>
  API.get(`${R.base}${R.task}/${id}`);

export const exportPdf = (params: Record<string, any>) =>
  API.get(`${R.base}/reports/download/pdf`, {
    params,
    responseType: "blob",
  });

export const getReports = (params: Record<string, any>) =>
  API.get(`${R.base}${R.reports}`, { params });
