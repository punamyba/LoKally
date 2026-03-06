// contactApi.ts — all contact-related API calls in one place
import axiosInstance from "../../../shared/config/axiosinstance";

export type ContactStatus = "new" | "open" | "replied" | "closed";

export const contactApi = {
  // ── USER ────────────────────────────────────────────────────────────────
  sendMessage: (data: {
    name: string; email: string; subject?: string; message: string;
  }) => axiosInstance.post("/contact", data).then(r => r.data),

  getMyConversations: () =>
    axiosInstance.get("/contact/my-messages").then(r => r.data),

  getMyConversationDetail: (id: number) =>
    axiosInstance.get(`/contact/my-messages/${id}`).then(r => r.data),

  userReply: (id: number, body: string) =>
    axiosInstance.post(`/contact/my-messages/${id}/reply`, { body }).then(r => r.data),

  // ── ADMIN ────────────────────────────────────────────────────────────────
  adminGetAll: (status?: ContactStatus) =>
    axiosInstance
      .get("/contact/admin", { params: status ? { status } : {} })
      .then(r => r.data),

  adminGetDetail: (id: number) =>
    axiosInstance.get(`/contact/admin/${id}`).then(r => r.data),

  adminReply: (id: number, body: string) =>
    axiosInstance.post(`/contact/admin/${id}/reply`, { body }).then(r => r.data),

  adminUpdateStatus: (id: number, status: ContactStatus) =>
    axiosInstance.patch(`/contact/admin/${id}/status`, { status }).then(r => r.data),

  adminToggleUserReply: (id: number) =>
    axiosInstance.patch(`/contact/admin/${id}/toggle-reply`).then(r => r.data),

  adminDelete: (id: number) =>
    axiosInstance.delete(`/contact/admin/${id}`).then(r => r.data),
};