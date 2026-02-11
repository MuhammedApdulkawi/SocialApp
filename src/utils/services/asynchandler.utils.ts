import { Request, Response, NextFunction } from "express";

/**
 * Wraps async route handlers to automatically catch errors and pass them to the error handler
 * Usage: router.post("/path", asyncHandler(controllerMethod))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
