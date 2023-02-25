import { workspace } from "vscode";
import { IContext } from "./extension";
import { getLogger, LogLevel } from "./logger";

export const subscriptions = (ctx: IContext) => {
  ctx.context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("anki.defaultDeck")) {
        ctx.config.defaultDeck = workspace.getConfiguration("anki").get("defaultDeck") || "";
      }

      if (e.affectsConfiguration("anki.log")) {
        const logger = getLogger();
        logger.setLevel(workspace.getConfiguration("anki").get("log") as LogLevel);
      }

      if (e.affectsConfiguration("anki.noteType")) {
        ctx.config.noteType = workspace.getConfiguration("anki").get("noteType", "BasicWithHighlightVSCode");
      }
    })
  );
};
