import { Router } from "express";

import reactService from "./service/react.service";
import { authenticationMiddleware } from "../../middleware";
import { asyncHandler } from "../../utils";
import { validationMiddleware } from "../../middleware/validation.middleware";
import {
  createReactValidator,
  getPostReactsValidator,
} from "../../common/validators/react.validator";

const ReactController = Router();

ReactController.post(
  "/:postId/addReact",
  authenticationMiddleware,
  validationMiddleware(createReactValidator),
  asyncHandler(reactService.React),
);
ReactController.get(
  "/:postId/ListAllReacts",
  authenticationMiddleware,
  validationMiddleware(getPostReactsValidator),
  asyncHandler(reactService.listAllReactsForPost),
);

export { ReactController };
