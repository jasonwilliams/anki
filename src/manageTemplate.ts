import { CONSTANTS } from "./constants";
import { IContext } from "./extension";
import { getLogger } from "./logger";

const css =
  ".card{font-family:arial;font-size:20px;text-align:center;color:#000;background-color:#fff}pre{text-align:left}";
const front = '<link rel="stylesheet" href="_vscodeAnkiPlugin.css" />{{Front}}';
const back = "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}";
const model = {
  modelName: CONSTANTS.defaultTemplateName,
  inOrderFields: ["Front", "Back"],
  css,
  cardTemplates: [
    {
      Name: "Card 1",
      Front: front,
      Back: back,
    },
  ],
};

export async function updateTemplate(ctx: IContext) {
  getLogger().info(`Updating ${CONSTANTS.defaultTemplateName} in Anki`);
  const result = await ctx.ankiService.updateModelTemplate(model);
  if (result === null) {
    getLogger().info(`Updating ${CONSTANTS.defaultTemplateName} successful`);
  } else {
    getLogger().error(
      `Updating ${CONSTANTS.defaultTemplateName} failed: ${result}`
    );
  }
}

/**
 * Check if the template exists, if not create it, if it does exist update it
 */
export async function createOrUpdateTemplate(ctx: IContext) {
  getLogger().info(
    `Checking if ${CONSTANTS.defaultTemplateName} exists as a model in Anki`
  );

  const modelNames: string[] = await ctx.ankiService.modelNames();

  if (modelNames.includes(CONSTANTS.defaultTemplateName)) {
    getLogger().info(`${CONSTANTS.defaultTemplateName} found in Anki`);
    await updateTemplate(ctx);
    return;
  } else {
    getLogger().info(
      `${CONSTANTS.defaultTemplateName} was not found in Anki. Will attempt to upload..`
    );

    const result = await ctx.ankiService.createModel(model);
    if (result.error) {
      getLogger().error(`Failed to upload template: ${result.error}`);
      throw new Error("Failed to upload template!");
    }
  }
}
