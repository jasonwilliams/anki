import { IContext } from "./extension";
import { commands, ProgressLocation, window } from "vscode";
import { Transformer } from "./markdown/transformer";
import { CONSTANTS } from "./constants";

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
          title: `Sending to Deck...`,
          cancellable: false,
        },
        async () => {
          try {
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
            window.showErrorMessage(e);
          }
        }
      );
    }
  );

  ctx.context.subscriptions.push(
    disposableSync,
    disposableSendToDeck,
    disposableSendToStandalone
  );
};
