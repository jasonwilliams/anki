import { ExtensionContext, Disposable, window } from "vscode";
import { AnkiService } from "./AnkiService";
import { readFileSync } from "fs";
import path from "path";
import { createOrUpdateTemplate } from "./manageTemplate";
import { getLogger } from "./logger";
import { IContext } from "./extension";

/**
 * The same file names should overwrite, so older versions will eventually update
 * @see https://github.com/FooSoft/anki-connect/issues/158#issuecomment-622669323
 */
export async function initialSetup(ctx: IContext) {
  getLogger().info("Running Setup");
  let result: any[] = [],
    disposable: Disposable;

  // get dark-mode override
  // The selectors in here are more specific so will kick in when darkMode is turned on
  const vscodeAnkiPlugin = readFileSync(
    path.join(
      ctx.context.extensionPath,
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
    disposable = window.setStatusBarMessage("Uploading resources to Anki...");
    await createOrUpdateTemplate(ctx);
    result = await ctx.ankiService.storeMultipleFiles(resources);
    disposable.dispose();
  } catch (e: any) {
    window.showErrorMessage(
      "Anki Installation: Unable to update resources on Anki, please make sure Anki is running and try again"
    );
    ctx.logger.error(e);
    // If any of the above failed we don't want to update the version, meaning it will try again next time the extension has started
    return;
  }

  // If assets are safely installed we can set a flag so we don't need to do this action again
  if (result.every((v) => v === null)) {
    getLogger().info("Successfully updated Anki, storing flag");
    ctx.context.globalState.update("installedVersion", ctx.extMeta.version);
  }
}
