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
  let result;
  try {
    // There seems to be an issue here with updating the model silently failing
    // Check to see if there's any errors from this API call
    // https://github.com/jasonwilliams/anki/issues/59
    result = await ctx.ankiService.updateModelTemplate(model);
  } catch(e: any) {
    getLogger().error(`updating the template has failed: ${e}`);
    getLogger().error(e);
    result = false;
  }
  if (result === null) {
    getLogger().info(`Updating ${CONSTANTS.defaultTemplateName} successful`);
  } else {
    getLogger().error(
      `Updating ${CONSTANTS.defaultTemplateName} failed: ${result}`
    );
  }
}

// Is our note type installed on Anki?
export async function isTemplateInstalled(ctx: IContext): Promise<boolean> {
  const modelNames: string[] = await ctx.ankiService.modelNames();
  return modelNames.includes(CONSTANTS.defaultTemplateName);
}
/**
 * Check if the template exists, if not create it, if it does exist update it
 */
export async function createOrUpdateTemplate(ctx: IContext) {
  getLogger().info(
    `Checking if ${CONSTANTS.defaultTemplateName} exists as a model in Anki`
  );

  if (await isTemplateInstalled(ctx)) {
    getLogger().info(`${CONSTANTS.defaultTemplateName} found in Anki`);
    await updateTemplate(ctx);
    return;
  } else {
    getLogger().info(
      `${CONSTANTS.defaultTemplateName} was not found in Anki. Will attempt to upload..`
    );
    let result;
    try {
      result = await ctx.ankiService.createModel(model);
    } catch(e) {
      getLogger().error(`Creating the template on Anki has failed: ${e}`);
      throw new Error(`Failed to upload template! ${e}`);
    }

    if (result.error) {
      getLogger().error(`Failed to upload template: ${result.error}`);
      throw new Error("Failed to upload template!");
    }
  }
}
