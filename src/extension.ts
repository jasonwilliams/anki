// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { workspace } from "vscode";
import { AnkiService } from "./AnkiService";
import { AnkiCardProvider } from "./AnkiCardProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Grab config
  const schema = workspace.getConfiguration("anki.api").get("schema");
  const hostname = workspace.getConfiguration("anki.api").get("hostname");
  const port = workspace.getConfiguration("anki.api").get("port");

  const ankiService = new AnkiService(`${schema}://${hostname}:${port}`);
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "anki-sync.sync",
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
            vscode.window.showErrorMessage(
              "Failed to connect to Anki: Do you have Anki running?"
            );
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

  context.subscriptions.push(disposable);

  return {
    extendMarkdownIt(md: any) {
      return md.use(require("markdown-it-deflist"));
    },
  };
}

// this method is called when your extension is deactivated
export function deactivate() {}
