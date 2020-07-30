/**
 * A Simple Wrapper to hold the state of our "singleton" (per extension) IVSCodeExtLogger
 * implementation.
 */

import { IVSCodeExtLogger } from "@vscode-logging/logger";

let _logger: IVSCodeExtLogger;
let isInitialized = false;

export function getLogger(): IVSCodeExtLogger {
  if (!isInitialized) {
    throw Error("Logger has not yet been initialized!");
  }
  return _logger;
}

/**
 * This function should be invoked after the Logger has been initialized in the Extension's `activate` function.
 */
export function initLogger(newLogger: IVSCodeExtLogger) {
  isInitialized = true;
  _logger = newLogger;
}
