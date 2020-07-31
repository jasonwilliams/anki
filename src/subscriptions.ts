import { IContext } from "./extension";
import { workspace } from "vscode";

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
};
