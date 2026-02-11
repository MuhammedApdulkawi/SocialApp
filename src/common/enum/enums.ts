export enum USER_ROLE {
  USER = "user",
  ADMIN = "admin",
}

export enum USER_GENDER {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum USER_PROVIDER {
  GOOGLE = "google",
  LOCAL = "local",
}

export enum OTP_TYPE {
  VERIFY = "verify",
  RESET = "reset",
  CHANGE_EMAIL = "change-email",
  TWO_FACTOR_AUTH = "two-factor-auth",
}

export enum FRIENDSHIP_STATUS {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export enum CONVERSATION_TYPE {
  PRIVATE = "private",
  GROUP = "group",
}

export enum POST_PRIVACY {
  PUBLIC = "public",
  FRIENDS = "friends",
  ONLY_ME = "only_me",
}

export enum KEY_TYPE {
  PROFILE_IMAGE = "profileImage",
  COVER_IMAGE = "coverPic",
  POST_IMAGE = "postImage",
  COMMENT_IMAGE = "commentImage",
}

export enum REACT_TYPE {
  LIKE = "like",
 DISLIKE = "dislike",
}