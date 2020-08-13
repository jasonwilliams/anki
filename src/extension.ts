// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  window,
  extensions,
  ExtensionContext,
  workspace,
  Disposable,
} from "vscode";
import path from "path";
import { readFileSync } from "fs";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";
import {
  getExtensionLogger,
  IVSCodeExtLogger,
  LogLevel,
} from "@vscode-logging/logger";
import { initLogger, getLogger } from "./logger";
import { registerCommands } from "./commands";
import { createOrUpdateTemplate } from "./manageTemplate";
import semver from "semver";
import { subscriptions } from "./subscriptions";
import { AnkiFS, initFilesystem } from "./fileSystemProvider";
import { initState, getAnkiState } from "./state";
import { initialSetup } from "./initialSetup";

require("./resources/vscodeAnkiPlugin.scss");

export interface IConfig {
  defaultDeck: string;
  log: LogLevel;
}

export interface IContext {
  ankiService: AnkiService;
  /** ExtensionContext from VSCode */
  context: ExtensionContext;
  logger: IVSCodeExtLogger;
  config: IConfig;
  extMeta: any;
  getAnkiFS?: () => AnkiFS;
  getAnkiState?: () => any;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  "Failed to connect to Anki: Do you have Anki running?";
  const config: IConfig = {
    defaultDeck: workspace
      .getConfiguration("anki")
      .get("defaultDeck") as string,
    log: workspace.getConfiguration("anki").get("log") as LogLevel,
  };

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

  const ankiExt = extensions.getExtension("jasew.anki");
  const extMeta = ankiExt?.packageJSON;

  // Set up logging
  const logOutputChannel = window.createOutputChannel(extMeta.displayName);

  const extLogger = getExtensionLogger({
    extName: extMeta.displayName,
    level: config.log,
    logPath: context.logPath,
    logOutputChannel: logOutputChannel,
  });

  // Initialize logger
  initLogger(extLogger);

  const extContext: IContext = {
    ankiService,
    logger: extLogger,
    context: context,
    config,
    extMeta,
  };

  // Check to see if we need to upload assets into Anki
  // If the extension has updated, that is a good time to re-upload
  if (
    semver.gt(
      extMeta.version,
      context.globalState.get("installedVersion") ?? "0.0.0"
    )
  ) {
    getLogger().info(`new version detected (${extMeta.version}), setting up`);
    initialSetup(extContext);
  }

  registerCommands(extContext);

  subscriptions(extContext);

  // FileSystem needs to be initiated before the TreeView Api
  initFilesystem(extContext);

  initState();
  extContext.getAnkiState = getAnkiState;

  // Register TreeView API
  window.registerTreeDataProvider("decks", new AnkiCardProvider(extContext));
}

// this method is called when your extension is deactivated
export function deactivate() {}
