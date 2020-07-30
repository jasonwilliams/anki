// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {
  window,
  extensions,
  commands,
  ExtensionContext,
  ProgressLocation,
  workspace,
  Disposable,
} from "vscode";
import path from "path";
import { readFileSync } from "fs";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { Transformer } from "./markdown/transformer";
import { getExtensionLogger, IVSCodeExtLogger } from "@vscode-logging/logger";
import { initLogger } from "./logger";
import { registerCommands } from "./commands";
import { createOrUpdateTemplate } from "./manageTemplate";

require("./resources/vscodeAnkiPlugin.scss");

export interface IContext {
  ankiService: AnkiService;
  /** ExtensionContext from VSCode */
  context: ExtensionContext;
  logger: IVSCodeExtLogger;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  const defaultTemplateName = "BasicWithHighlightVSCode";
  "Failed to connect to Anki: Do you have Anki running?";
  const defaultDeck = workspace.getConfiguration("anki").get("defaultDeck");

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

  const ankiExt = extensions.getExtension("jasew.anki");
  const extMeta = ankiExt?.packageJSON;

  // Set up logging
  const logOutputChannel = window.createOutputChannel(extMeta.name);

  const extLogger = getExtensionLogger({
    extName: extMeta.name,
    level: "info",
    logPath: context.logPath,
    logOutputChannel: logOutputChannel,
  });

  // Initialize logger
  initLogger(extLogger);

  const extContext: IContext = {
    ankiService,
    logger: extLogger,
    context: context,
  };

  // Check to see if we need to upload assets into Anki
  // if (!context.globalState.get("resourceFilesInstalled")) {
  initialSetup(context, ankiService);
  // }

  registerCommands(extContext);
  // Register TreeView API
  window.registerTreeDataProvider("decks", new AnkiCardProvider(ankiService));

  /**
   * The same file names should overwrite, so older versions will eventually update
   * @see https://github.com/FooSoft/anki-connect/issues/158#issuecomment-622669323
   */
  async function initialSetup(
    context: ExtensionContext,
    ankiService: AnkiService
  ) {
    let result: any[] = [],
      disposable: Disposable;

    // get dark-mode override
    // The selectors in here are more specific so will kick in when darkMode is turned on
    const vscodeAnkiPlugin = readFileSync(
      path.join(
        context.extensionPath,
        "out",
        "resources",
        "vscodeAnkiPlugin.css"
      ),
      {
        encoding: "base64",
      }
    );

    const resources = [
      {
        filename: "_vscodeAnkiPlugin.css",
        data: vscodeAnkiPlugin,
      },
    ];
    try {
      disposable = window.setStatusBarMessage("Uploading resources to Anki...");
      await createOrUpdateTemplate(extContext);
      result = await ankiService.storeMultipleFiles(resources);
      disposable.dispose();
    } catch (e) {
      console.log(e);
      window.showErrorMessage(
        "Anki Installation: Unable to update resources on Anki"
      );
      extLogger.error(e);
    }

    // If assets are safely installed we can set a flag so we don't need to do this action again
    if (result.every((v) => v === null)) {
      context.globalState.update("resourceFilesInstalled", true);
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
