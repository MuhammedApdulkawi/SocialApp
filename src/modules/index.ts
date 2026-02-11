import { Router } from 'express';

import { ReactController } from './react/react.controller';
import { authUserController } from './user/controller/auth.user.controller';
import { ProfileUserController } from './user/controller/profile.user.controller';
import { PostController } from './post/controller/post.controller';
import { CommentController } from './comment/controller/comment.controller';

const routers = Router();

routers.use("/user/auth", authUserController);
routers.use("/user/profile", ProfileUserController);
routers.use("/post", PostController);
routers.use("/comment", CommentController);
routers.use("/react", ReactController);

export { routers };