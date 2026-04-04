// user.dto.js — controls what data is sent to client per use case

// navbar/dropdown — naam, avatar, email chahincha (dropdown ma email dekhaucha)
export const NavbarUserDTO = (user) => ({
    id:         user.id,
    first_name: user.first_name,
    last_name:  user.last_name,
    email:      user.email,
    avatar:     user.avatar,
    role:       user.role,
  });
  
  // full profile page — sabai personal fields
  export const ProfileDTO = (user) => ({
    id:         user.id,
    first_name: user.first_name,
    last_name:  user.last_name,
    email:      user.email,
    avatar:     user.avatar,
    bio:        user.bio,
    gender:     user.gender,
  });
  
  // public profile — sensitive fields (email) hide garnu
  export const PublicProfileDTO = (user) => ({
    id:         user.id,
    first_name: user.first_name,
    last_name:  user.last_name,
    avatar:     user.avatar,
    bio:        user.bio,
    gender:     user.gender,
  });