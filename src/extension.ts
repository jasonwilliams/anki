// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AnkiService } from "./AnkiService";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "anki-sync" is now active!');

  // @todo use configuration
  const ankiService = new AnkiService(`http://localhost:8765`);
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
            vscode.window.showErrorMessage("Failed to connect to Anki");
          }
        }
      );
      // Display a message box to the user
    }
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
