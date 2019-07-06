import EnvironmentVariables from './env';

export enum LogLevel {
  trace = 50,
  debug = 40,
  info = 30,
  warn = 20,
  error = 10
}

export default class Logger {
  private static _cachedEnvLogLevel: LogLevel | null = null;

  private static get envLogLevel(): LogLevel {
    const envLogLevel = EnvironmentVariables.logLevel.toLowerCase().trim();

    switch (envLogLevel) {
      case 'info':
        this._cachedEnvLogLevel = LogLevel.info;
        break;
      case 'warn':
        this._cachedEnvLogLevel = LogLevel.warn;
        break;
      case 'error':
        this._cachedEnvLogLevel = LogLevel.error;
        break;
      case 'debug':
        this._cachedEnvLogLevel = LogLevel.debug;
        break;
      case 'trace':
        this._cachedEnvLogLevel = LogLevel.trace;
        break;
      default:
        this._cachedEnvLogLevel = LogLevel.info;
        break;
    }

    return this._cachedEnvLogLevel;
  }

  public static log(logLevel: LogLevel, message: string, ...additionalData: any[]): void {
    const envLogLevel = this.envLogLevel;
    if (logLevel.valueOf() > envLogLevel.valueOf()) {
      return;
    }

    switch (logLevel) {
      case LogLevel.debug:
        console.debug(message, ...additionalData);
        break;
      case LogLevel.error:
        console.error(message, ...additionalData);
        break;
      case LogLevel.info:
        console.info(message, ...additionalData);
        break;
      case LogLevel.trace:
        console.trace(message, ...additionalData);
        break;
      case LogLevel.warn:
        console.warn(message, ...additionalData);
        break;
    }
  }

  public static info(message: string, ...additionalData: any[]): void {
    return this.log(LogLevel.info, message, ...additionalData);
  }

  public static warn(message: string, ...additionalData: any[]): void {
    return this.log(LogLevel.warn, message, ...additionalData);
  }

  public static debug(message: string, ...additionalData: any[]): void {
    return this.log(LogLevel.debug, message, ...additionalData);
  }

  public static trace(message: string, ...additionalData: any[]): void {
    return this.log(LogLevel.trace, message, ...additionalData);
  }

  public static error(message: string, ...additionalData: any[]): void {
    return this.log(LogLevel.error, message, ...additionalData);
  }
}