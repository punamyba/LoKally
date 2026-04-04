// post.dto.js — controls what post data is sent to client per use case

// feed/list ma dekhine post — sabai chainey fields
export const PostDTO = (post) => ({
    id:             post.id,
    user_id:        post.user_id,
    caption:        post.caption,
    images:         post.images,
    place_id:       post.place_id,
    likes_count:    post.likes_count,
    comments_count: post.comments_count,
    created_at:     post.created_at,
    author:         post.author ? {
      id:         post.author.id,
      first_name: post.author.first_name,
      last_name:  post.author.last_name,
      avatar:     post.author.avatar,
    } : null,
    has_liked:     post.has_liked     ?? false,
    liked_type:    post.liked_type    ?? "like",
    is_bookmarked: post.is_bookmarked ?? false,
  });