// src/features/auth/Contact/contactApi.ts
// Contact API calls using axiosInstance (baseURL already set and token auto-attached)

import axiosInstance from "../../../shared/config/axiosinstance";
import type { ContactStatus } from "../Admin/AdminTypes";

export type SubmitContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const contactApi = {
  // Public: user submits message
  submit: (payload: SubmitContactPayload) =>
    axiosInstance.post("/contact", payload).then((r) => r.data),

  // Admin: list messages, optional filter
  adminList: (status?: ContactStatus) => {
    const url = status ? `/contact/admin?status=${status}` : "/contact/admin";
    return axiosInstance.get(url).then((r) => r.data);
  },

  // Admin: get single message
  adminGet: (id: number) =>
    axiosInstance.get(`/contact/admin/${id}`).then((r) => r.data),

  // Admin: update status
  adminUpdateStatus: (id: number, status: ContactStatus) =>
    axiosInstance.patch(`/contact/admin/${id}/status`, { status }).then((r) => r.data),

  // Admin: send reply
  adminReply: (id: number, reply: string) =>
    axiosInstance.post(`/contact/admin/${id}/reply`, { reply }).then((r) => r.data),
};