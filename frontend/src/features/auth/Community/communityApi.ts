import axiosInstance from "../../../shared/config/axiosinstance";

export const communityApi = {
  getFeed:        (page = 1, limit = 10) =>
    axiosInstance.get(`/posts?page=${page}&limit=${limit}`).then(r => r.data),

  getPost:        (id: number) =>
    axiosInstance.get(`/posts/${id}`).then(r => r.data),

  createPost:     (formData: FormData) =>
    axiosInstance.post("/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data),

  deletePost:     (id: number) =>
    axiosInstance.delete(`/posts/${id}`).then(r => r.data),

  toggleLike:     (postId: number, reactType = "like") =>
    axiosInstance.post(`/posts/${postId}/like`, { react_type: reactType }).then(r => r.data),

  getComments:    (postId: number) =>
    axiosInstance.get(`/posts/${postId}/comments`).then(r => r.data),

  addComment:     (postId: number, body: string, parentId?: number) =>
    axiosInstance.post(`/posts/${postId}/comments`, { body, parent_id: parentId }).then(r => r.data),

  deleteComment:  (postId: number, commentId: number) =>
    axiosInstance.delete(`/posts/${postId}/comments/${commentId}`).then(r => r.data),

  toggleBookmark: (postId: number) =>
    axiosInstance.post(`/posts/${postId}/bookmark`).then(r => r.data),

  reportPost:     (postId: number, reason: string) =>
    axiosInstance.post(`/posts/${postId}/report`, { reason }).then(r => r.data),

  // Admin
  adminGetPosts:      (filter = "all", page = 1) =>
    axiosInstance.get(`/admin/posts?filter=${filter}&page=${page}`).then(r => r.data),

  adminHidePost:      (id: number) =>
    axiosInstance.patch(`/admin/posts/${id}/hide`).then(r => r.data),

  adminUnhidePost:    (id: number) =>
    axiosInstance.patch(`/admin/posts/${id}/unhide`).then(r => r.data),

  adminDeletePost:    (id: number) =>
    axiosInstance.delete(`/admin/posts/${id}`).then(r => r.data),

  adminDismissReports:(id: number) =>
    axiosInstance.patch(`/admin/posts/${id}/dismiss-reports`).then(r => r.data),
};