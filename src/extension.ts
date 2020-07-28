// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path from "path";
import { readFileSync } from "fs";
import { window, workspace } from "vscode";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { Transformer } from "./markdown/transformer";
require("./resources/vscodeAnkiPlugin.scss");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  const defaultDeck = workspace.getConfiguration("anki").get("defaultDeck");
  const defaultTemplateName = "BasicWithHighlightVSCode";

  const failedToConnectMessage =
    "Failed to connect to Anki: Do you have Anki running?";

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

  // Check to see if we need to upload assets into Anki
  // if (!context.globalState.get("resourceFilesInstalled")) {
  initialSetup(context, ankiService);
  // }

  // Handle Syncing the Anki Instance
  let disposableSync = vscode.commands.registerCommand(
    "anki.sync",
    async () => {
      // The code you place here will be executed every time your command is executed
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Syncing your Anki Instance...",
          cancellable: false,
        },
        async () => {
          try {
            await ankiService.syncGui();
          } catch (e) {
            vscode.window.showErrorMessage(failedToConnectMessage);
          }
        }
      );
    }
  );

  // Handle Syncing the Anki Instance
  let disposableSendToDeck = vscode.commands.registerCommand(
    "anki.sendToDeck",
    async () => {
      // The code you place here will be executed every time your command is executed
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Sending to Deck: ${defaultDeck}...`,
          cancellable: false,
        },
        async () => {
          try {
            const file = window.activeTextEditor?.document.getText() ?? "";
            await new Transformer(file, ankiService, true).transform();
          } catch (e) {
            vscode.window.showErrorMessage(e);
          }
        }
      );
    }
  );

  // Handle Syncing the Anki Instance
  let disposableSendToStandalone = vscode.commands.registerCommand(
    "anki.sendToStandalone",
    async () => {
      // The code you place here will be executed every time your command is executed
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Sending to own deck...`,
          cancellable: false,
        },
        async () => {
          try {
            const file = window.activeTextEditor?.document.getText() ?? "";
            await new Transformer(file, ankiService, false).transform();
          } catch (e) {
            vscode.window.showErrorMessage(e);
          }
        }
      );
    }
  );

  // Register TreeView API
  vscode.window.registerTreeDataProvider(
    "decks",
    new AnkiCardProvider(ankiService)
  );

  context.subscriptions.push(
    disposableSync,
    disposableSendToDeck,
    disposableSendToStandalone
  );

  /**
   * The same file names should overwrite, so older versions will eventually update
   * @see https://github.com/FooSoft/anki-connect/issues/158#issuecomment-622669323
   */
  async function initialSetup(
    context: vscode.ExtensionContext,
    ankiService: AnkiService
  ) {
    let result: any[] = [],
      disposable: vscode.Disposable;

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
      disposable = vscode.window.setStatusBarMessage(
        "Uploading resources to Anki..."
      );
      await createTemplate(ankiService);
      result = await ankiService.storeMultipleFiles(resources);
      disposable.dispose();
    } catch (e) {
      vscode.window.showErrorMessage(
        "Anki Installation: Unable to update resources on Anki"
      );
    }

    // If assets are safely installed we can set a flag so we don't need to do this action again
    console.log(result);
    if (result.every((v) => v === null)) {
      context.globalState.update("resourceFilesInstalled", true);
    }
  }

  async function createTemplate(ankiService: AnkiService) {
    // Creating a template twice causes an error, we should check if it already exists first..
    const modelList: string[] = await ankiService.modelNames();
    if (modelList.includes(defaultTemplateName)) {
      console.log(`${defaultTemplateName} already exists in Anki.`);
      return;
    }

    const model = {
      modelName: defaultTemplateName,
      inOrderFields: ["Front", "Back"],
      css:
        ".card{font-family:arial;font-size:20px;text-align:center;color:#000;background-color:#fff}pre{text-align:left}",
      cardTemplates: [
        {
          Name: "Card 1",
          Front:
            '<link rel="stylesheet" href="_vscodeAnkiPlugin.css" />{{Front}}',
          Back: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
        },
      ],
    };

    await ankiService.createModel(model);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
