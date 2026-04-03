// adminApi.ts
// All admin API calls are here.
// We use axiosInstance which already has:
//   - baseURL set to http://localhost:5001/api
//   - JWT token auto-attached from localStorage

import axiosInstance from "../../../shared/config/axiosinstance";

export const adminApi = {

  // Get dashboard stats + top 5 pending places preview
  getStats: () =>
    axiosInstance.get("/admin/stats").then((r) => r.data),

  // Get chart data — category pie + monthly bar
  getChartData: () =>
    axiosInstance.get("/admin/chart-data").then((r) => r.data),

  // Get places list — filter by status (pending / approved / rejected / all)
  getPlaces: (status?: string) => {
    const url = status ? `/admin/places?status=${status}` : "/admin/places";
    return axiosInstance.get(url).then((r) => r.data);
  },

  // Approve a place by its ID
  approvePlace: (id: number) =>
    axiosInstance.patch(`/admin/places/${id}/approve`).then((r) => r.data),

  // Reject a place with a reason
  rejectPlace: (id: number, reason: string) =>
    axiosInstance.patch(`/admin/places/${id}/reject`, { reason }).then((r) => r.data),

  // Get all registered users list
  getUsers: () =>
    axiosInstance.get("/admin/users").then((r) => r.data),

  // Admin adds a new place — auto-approved
  addPlace: (formData: FormData) =>
    axiosInstance.post("/admin/places", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Update any place
  updatePlace: (id: number, formData: FormData) =>
    axiosInstance.put(`/admin/places/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),

  // Permanently delete a place
  deletePlace: (id: number) =>
    axiosInstance.delete(`/admin/places/${id}`).then((r) => r.data),
};