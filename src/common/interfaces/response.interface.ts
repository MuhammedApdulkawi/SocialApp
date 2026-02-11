export interface IMetaResponse {
  status: number;
  success: boolean;
}

export interface IDataResponse {
  message: string;
  data?: unknown;
}

export interface IErrorDataResponse {
  message: string;
  context?: object;
}

export interface ISuccessResponse {
  meta: IMetaResponse;
  data?: IDataResponse;
}

export interface IErrorResponse {
  meta: IMetaResponse;
  error?: IErrorDataResponse;
}
