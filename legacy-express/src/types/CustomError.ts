export interface CustomError extends Error {
  status?: number;
}

export interface SendFormattedErrorOptions {
  skipToast?: boolean;
  [key: string]: unknown;
}
