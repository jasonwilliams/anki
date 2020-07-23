// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { window, workspace } from "vscode";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";
import { Transformer } from "./markdown/transformer";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");
  const defaultDeck = workspace.getConfiguration("anki").get("defaultDeck");
  console.log(
    workspace.getConfiguration("anki.md.card").get("separator") as string
  );
  const failedToConnectMessage =
    "Failed to connect to Anki: Do you have Anki running?";

  // Start up Anki Service
  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);

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

  return {
    extendMarkdownIt(md: any) {
      return md.use(require("markdown-it-deflist"));
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}
