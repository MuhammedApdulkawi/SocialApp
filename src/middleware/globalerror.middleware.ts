import { NextFunction, Request, Response } from "express";
import { FailureResponse, HttpException } from "../utils";

export async function globalerror(
  err: HttpException | Error | null,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!err) {
    return next();
  }

  console.error("Error caught by global handler:", err);

  if (err instanceof HttpException) {
    return res
      .status(err.statusCode)
      .json(FailureResponse(err.message, err.statusCode, err.error));
  }

  if (err instanceof SyntaxError) {
    return res
      .status(400)
      .json(FailureResponse("Invalid JSON in request body", 400));
  }

  // Default 500 error
  const isDevelopment ="development";
  console.log({ message: err.message, stack: err.stack }, isDevelopment);
  
  return res
    .status(500)
    .json(
      FailureResponse(
        "Internal Server Error",
        500,
        isDevelopment ? { message: err.message, stack: err.stack } : undefined,
      ),
    );
}
