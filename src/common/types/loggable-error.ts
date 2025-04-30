export interface LoggableError extends Error {
  __alreadyLogged?: boolean;
}
