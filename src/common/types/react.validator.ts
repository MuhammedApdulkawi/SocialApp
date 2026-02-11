import { z } from "zod";
import { createReactValidator, getPostReactsValidator } from "../validators";


export type createReactValidatorType = z.infer<
  typeof createReactValidator.body
>;
export type getPostReactsParamsType = z.infer<
  typeof getPostReactsValidator.params
>;
