export interface PostAuthor {
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
    updated_at: string;
    author: PostAuthor;
    place?: { id: number; name: string } | null;
    has_liked?: boolean;
    liked_type?: string;
    is_bookmarked?: boolean;
  }
  
  export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    parent_id: number | null;
    body: string;
    is_hidden: boolean;
    created_at: string;
    user: PostAuthor;
    replies?: Comment[];
  }
  
  export type ReactType = "like" | "love" | "wow" | "haha" | "sad" | "angry";
  
  export const REACTS: Record<ReactType, { emoji: string; label: string; color: string }> = {
    like:  { emoji: "👍", label: "Like",  color: "#1d4ed8" },
    love:  { emoji: "❤️", label: "Love",  color: "#e11d48" },
    wow:   { emoji: "😮", label: "Wow",   color: "#d97706" },
    haha:  { emoji: "😂", label: "Haha",  color: "#ca8a04" },
    sad:   { emoji: "😢", label: "Sad",   color: "#6366f1" },
    angry: { emoji: "😡", label: "Angry", color: "#dc2626" },
  };
  
  export const REPORT_REASONS = [
    "Spam or misleading",
    "Inappropriate content",
    "Harassment or bullying",
    "False information",
    "Violates community guidelines",
    "Other",
  ];