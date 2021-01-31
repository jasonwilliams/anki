import { IContext } from "./extension";
import { workspace, window } from "vscode";
import { sendFile } from "./sendFile";

export const subscriptions = (ctx: IContext) => {
  ctx.context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("anki.defaultDeck")) {
        ctx.config.defaultDeck =
          workspace.getConfiguration("anki").get("defaultDeck") || "";
      }

      if (e.affectsConfiguration("anki.log")) {
        ctx.config.log =
          workspace.getConfiguration("anki").get("log") || "error";
      }
    })
  );

  ctx.context.subscriptions.push(
    workspace.onDidSaveTextDocument((e) => {
      if (e.languageId == "markdown") {
        if (workspace.getConfiguration("anki.send").get("keepSync")) {
          sendFile(e.uri, ctx).then(() => {
            window.showInformationMessage("Send Changes to Anki");
          });
        }
      }      
    })
  );
}
