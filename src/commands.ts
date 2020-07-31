import { IContext } from "./extension";
import { Uri, commands, ProgressLocation, window, workspace } from "vscode";
import { Transformer } from "./markdown/transformer";
import { CONSTANTS } from "./constants";
import { getLogger } from "./logger";
import { downloadAndUnzipVSCode } from "vscode-test";

export const registerCommands = (ctx: IContext) => {
  // Handle Syncing the Anki Instance
  let disposableSync = commands.registerCommand("anki.sync", async () => {
    // The code you place here will be executed every time your command is executed
    window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Syncing your Anki Instance...",
        cancellable: false,
      },
      async () => {
        try {
          await ctx.ankiService.syncGui();
        } catch (e) {
          window.showErrorMessage(CONSTANTS.failedToConnectMessage);
        }
      }
    );
  });

  // Handle Syncing the Anki Instance
  let disposableSendToDeck = commands.registerCommand(
    "anki.sendToDeck",
    async () => {
      // The code you place here will be executed every time your command is executed
      window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: `Sending to Deck: ${ctx.config.defaultDeck}...`,
          cancellable: false,
        },
        async () => {
          try {
            getLogger().info("active Editor..");
            const file = window.activeTextEditor?.document.getText() ?? "";
            await new Transformer(file, ctx.ankiService, true).transform();
          } catch (e) {
            window.showErrorMessage(e);
          }
        }
      );
    }
  );

  // Handle Syncing the Anki Instance
  let disposableSendToStandalone = commands.registerCommand(
    "anki.sendToStandalone",
    async () => {
      // The code you place here will be executed every time your command is executed
      window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: `Sending to own deck...`,
          cancellable: false,
        },
        async () => {
          try {
            const file = window.activeTextEditor?.document.getText() ?? "";
            await new Transformer(file, ctx.ankiService, false).transform();
          } catch (e) {
            getLogger().error(e);
            getLogger().error(
              "This is usually because there is no H1 or something is before the title heading"
            );
            window.showErrorMessage(`Deck not sent: ${e.message}`);
          }
        }
      );
    }
  );

  let disposableTreeItemOpen = commands.registerCommand(
    "anki.treeItem",
    async (uri) => {
      workspace.openTextDocument(Uri.parse(uri));
    }
  );

  ctx.context.subscriptions.push(
    disposableSync,
    disposableSendToDeck,
    disposableSendToStandalone,
    disposableTreeItemOpen
  );
};
