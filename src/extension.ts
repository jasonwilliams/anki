// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  getExtensionLogger,
  IVSCodeExtLogger,
  LogLevel
} from "@vscode-logging/logger";
import semver from "semver";
import {
  ExtensionContext, extensions, window, workspace
} from "vscode";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { AnkiService } from "./AnkiService";
import { registerCommands } from "./commands";
import { AnkiFS, initFilesystem } from "./fileSystemProvider";
import { initialSetup } from "./initialSetup";
import { getLogger, initLogger } from "./logger";
import { createOrUpdateTemplate, isTemplateInstalled } from "./manageTemplate";
import { getAnkiState, initState } from "./state";
import { subscriptions } from "./subscriptions";

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
export async function activate(context: ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  ("Failed to connect to Anki: Do you have Anki running?");
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
  
  getLogger().info(`Anki Extension v${extMeta?.version} activated`);
  const extContext: IContext = {
    ankiService,
    logger: extLogger,
    context: context,
    config,
    extMeta,
  };

  // There have been issues with the template being deleted from Anki, but the extension not knowing about it.
  // We will have to check on every activation to see if its still there
  // Check if ANKI is running and see if note type is installed
  // https://github.com/jasonwilliams/anki/issues/59
  const isUp = await ankiService.isUp();
  let templateInstalled: boolean;
  if (isUp) {
    getLogger().info('Anki is running, checking for note type..');
    templateInstalled = await isTemplateInstalled(extContext);
    getLogger().info(`Status of note type on Anki: ${templateInstalled}`);
    if (!templateInstalled) {
      await createOrUpdateTemplate(extContext);
    }
  } else {
    getLogger().info('Could not connect to Anki');
  }

  // Check to see if we need to upload assets into Anki
  // If the extension has updated, that is a good time to re-upload
  const globalStateVersion = context.globalState.get<string>("installedVersion") ?? "0.0.0";
  getLogger().info(`Checking extension version against cache: Extension: ${extMeta.version}, Cache: ${globalStateVersion}`);
  if (
    semver.gt(
      extMeta.version,
      globalStateVersion
    )
  ) {
    getLogger().info(`new version detected (${extMeta.version}), setting up...`);
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
