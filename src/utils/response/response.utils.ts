import { IErrorResponse, ISuccessResponse } from "../../common";

export function SuccessResponse<T>(
  message = "The request is successfully processed",
  status = 200,
  data?: T,
): ISuccessResponse {
  return {
    meta: {
      status,
      success: true,
    },
    data: {
      message,
      ...(data !== undefined && { data }),
    },
  };
}

export function FailureResponse(
  message = "The request is not successfully processed",
  status = 500,
  context?: object,
): IErrorResponse {
  return {
    meta: {
      status,
      success: false,
    },
    error: {
      message,
      context,
    },
  };
}
