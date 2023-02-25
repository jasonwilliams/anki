// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import semver from "semver";
import { ExtensionContext, extensions, window, workspace } from "vscode";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { AnkiService } from "./AnkiService";
import { registerCommands } from "./commands";
import { AnkiFS, initFilesystem } from "./fileSystemProvider";
import { initialSetup } from "./initialSetup";
import { getLogger, initLogger } from "./logger";
import "./resources/vscodeAnkiPlugin.scss";
import { getAnkiState, initState } from "./state";
import { subscriptions } from "./subscriptions";

export interface IConfig {
  defaultDeck: string;
  noteType: string;
}

export interface IContext {
  ankiService: AnkiService;
  /** ExtensionContext from VSCode */
  context: ExtensionContext;
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
    defaultDeck: workspace.getConfiguration("anki").get("defaultDeck") as string,
    noteType: workspace.getConfiguration("anki").get("noteType") as string,
  };

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

  const ankiExt = extensions.getExtension("jasew.anki");
  const extMeta = ankiExt?.packageJSON;

  // Initialize logger
  initLogger(workspace.getConfiguration("anki").get("log") || "error");

  getLogger().info(`Anki Extension v${extMeta?.version} activated`);
  const extContext: IContext = {
    ankiService,
    context: context,
    config,
    extMeta,
  };

  // Check to see if we need to upload assets into Anki
  // If the extension has updated, that is a good time to re-upload
  const globalStateVersion = context.globalState.get<string>("installedVersion") ?? "0.0.0";
  getLogger().info(
    `Checking extension version against cache: Extension: ${extMeta.version}, Cache: ${globalStateVersion}`
  );
  if (semver.gt(extMeta.version, globalStateVersion)) {
    getLogger().info(`Setup triggered by new version being detected (${extMeta.version})`);
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
