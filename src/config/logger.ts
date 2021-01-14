import Logger from 'le_node'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  NOTICE = 'notice',
  WARNING = 'warning',
  ERROR = 'err',
  CRITICAL = 'crit',
  ALERT = 'alert',
  EMERGENCY = 'emerg'
}

export type LogMessage = string | { [key: string]: any }


const leLogger = new Logger({
  token: process.env.LOGENTRIES_TOKEN
})

logger.info = (message: LogMessage) => {
  logger(LogLevel.INFO, message)
}

logger.notice = (message: LogMessage) => {
  logger(LogLevel.NOTICE, message)
}

logger.error = (message: LogMessage) => {
  logger(LogLevel.ERROR, message)
}

export function logger(logLevel: LogLevel, message: LogMessage): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(message)
  }
  else {
    leLogger.log(logLevel, message)
  }
}