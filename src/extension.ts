// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import path from "path";
import { readFileSync } from "fs";
import { window, workspace } from "vscode";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { Transformer } from "./markdown/transformer";
require("resources/prism-dark.css");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  const defaultDeck = workspace.getConfiguration("anki").get("defaultDeck");
  const failedToConnectMessage =
    "Failed to connect to Anki: Do you have Anki running?";

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

  // Check to see if we need to upload assets into Anki
  if (!context.globalState.get("resourceFilesInstalled")) {
    installResourceFiles(context, ankiService);
  }

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

  // Register TreeView API
  vscode.window.registerTreeDataProvider(
    "decks",
    new AnkiCardProvider(ankiService)
  );

  context.subscriptions.push(disposableSync, disposableSendToDeck);

  /**
   * The same file names should overwrite, so older versions will eventually update
   * @see https://github.com/FooSoft/anki-connect/issues/158#issuecomment-622669323
   */
  async function installResourceFiles(
    context: vscode.ExtensionContext,
    ankiService: AnkiService
  ) {
    let result: any[] = [],
      disposable: vscode.Disposable;

    // get dark-mode override
    // The selectors in here are more specific so will kick in when darkMode is turned on
    const contents = readFileSync(
      path.join(__dirname, "resources", "prism-dark.css"),
      {
        encoding: "base64",
      }
    );

    const resources = [
      {
        filename: "_prism-dark.css",
        data: contents,
      },
      {
        filename: "_prism.min.css",
        url:
          "https://cdnjs.cloudflare.com/ajax/libs/prism/1.20.0/themes/prism.min.css",
      },
    ];
    try {
      disposable = vscode.window.setStatusBarMessage(
        "Uploading resources to Anki..."
      );
      await createTemplate(ankiService);
      result = await ankiService.storeMultipleFiles(resources);
    } catch (e) {
      vscode.window.showErrorMessage(
        "Anki: Unable to update resources on Anki"
      );
      console.log(e);
    }

    // If assets are safely installed we can set a flag so we don't need to do this action again
    if (result.every((v) => v === null)) {
      // context.globalState.update("resourceFilesInstalled", true);
    }
  }

  async function createTemplate(ankiService: AnkiService) {
    const model = {
      name: "BasicWithHighlight",
      inOrderFields: ["Front", "Back"],
      css:
        ".card{font-family:arial;font-size:20px;text-align:center;color:#000;background-color:#fff}pre{text-align:left}",
      cardTemplates: [
        {
          Name: "Card 1",
          Front:
            '{{Front}}<link rel="stylesheet" href="_prism.min.css" /><link rel="stylesheet" href="_prism-dark.min.css" />',
          Back: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
        },
      ],
    };

    await ankiService.createModel(model);
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
