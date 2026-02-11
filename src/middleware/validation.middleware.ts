import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { BadRequestError } from "../utils";

type RequestKeyTypes = keyof Request;
type SchemaType = Partial<Record<RequestKeyTypes, ZodType>>;
type validationErrorsType = {
  key: RequestKeyTypes;
  issues: {
    path: PropertyKey[];
    message: string;
  }[];
};

export const validationMiddleware = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqKey: RequestKeyTypes[] = ["body", "params", "query", "headers"];

    const validationErrors: validationErrorsType[] = [];
    for (const key of reqKey) {
      if (schema[key]) {
        const result = schema[key].safeParse(req[key]);
        if (!result?.success) {
          const issues = result.error?.issues?.map((issue) => ({
            path: issue.path,
            message: issue.message,
          }));

          validationErrors.push({ key, issues: issues || [] });
        }
      }
    }
    if (validationErrors.length > 0) {
      throw new BadRequestError("Validation Error", { validationErrors });
    }
    next();
  };
};
