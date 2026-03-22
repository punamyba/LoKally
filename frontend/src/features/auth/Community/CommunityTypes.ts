export interface PostAuthor {
  avatar?: string | null;
  id: number;
  first_name: string;
  last_name: string;
}

export interface Post {
  id: number;
  user_id: number;
  caption: string | null;
  images: string | null;
  place_id: number | null;
  is_hidden: boolean;
  likes_count: number;
  comments_count: number;
  reports_count: number;
  created_at: string;
  updated_at?: string;
  author: PostAuthor;
  place?: {
    id: number;
    name: string;
  } | null;
  has_liked?: boolean;
  liked_type?: ReactType | string;
  is_bookmarked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  is_hidden?: boolean;
  created_at: string;
  user: PostAuthor;
  replies?: Comment[];
}

export type ReactType = "like" | "love" | "wow" | "haha" | "sad" | "angry";

export const REACTS: Record<
  ReactType,
  { label: string; color: string }
> = {
  like: { label: "Like", color: "#2563eb" },
  love: { label: "Love", color: "#e11d48" },
  wow: { label: "Wow", color: "#f59e0b" },
  haha: { label: "Haha", color: "#22c55e" },
  sad: { label: "Sad", color: "#64748b" },
  angry: { label: "Angry", color: "#ef4444" },
};

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "False information",
  "Hate speech",
  "Violence",
  "Other",
];