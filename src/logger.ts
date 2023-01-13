import { window, OutputChannel } from "vscode";
/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */
const logLevels = [
  "off",
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
] as const;
type LogLevel = (typeof logLevels)[number];

class Logger {
  private channel: OutputChannel;
  private logLevel: LogLevel;

  constructor(channel: OutputChannel, log: LogLevel) {
    this.channel = channel;
    this.logLevel = log;
  }

  private checkLevel(input: LogLevel): boolean {
    if (logLevels.indexOf(input) < logLevels.indexOf(this.logLevel)) {
      return true;
    }

    return false;
  }

  error(str: string) {
    if (this.checkLevel("error")) {
      this.channel.appendLine(`Error: ${str}`);
    }
  }

  info(str: string) {
    if (this.checkLevel("info")) {
      this.channel.appendLine(`Info: ${str}`);
    }
  }

  trace(str: string) {
    if (this.checkLevel("trace")) {
      this.channel.appendLine(`Trace: ${str}`);
    }
  }

  dispose(): void {
    this.channel.dispose();
  }
}

let _logger: Logger;
let isInitialized = false;

export function getLogger(): Logger {
  if (!isInitialized) {
    throw Error("Logger has not yet been initialized!");
  }
  return _logger;
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 */
export function initLogger(logLevel: LogLevel) {
  isInitialized = true;
  _logger = new Logger(window.createOutputChannel("Anki"), logLevel);
}
