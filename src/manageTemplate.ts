import { IContext } from "./extension";
import { getLogger } from "./logger";

type CardTemplate = {
  Name: string;
  Front: string;
  Back: string;
};

// Maps to an AnkiConnect model
export type Model = {
  modelName: string;
  inOrderFields: string[];
  css: string;
  cardTemplates: CardTemplate[];
};

const css =
  ".card{font-family:arial;font-size:20px;text-align:center;color:#000;background-color:#fff}pre{text-align:left}";
const front = '<link rel="stylesheet" href="_vscodeAnkiPlugin.css" />{{Front}}';
const back = "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}";
const basicWithHighlightVSCode: Model = {
  modelName: "BasicWithHighlightVSCode",
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

// Create a reversed card model
const basicWithHighlightVSCodeRev = {
  ...basicWithHighlightVSCode,
  modelName: "BasicWithHighlightVSCodeRev",
};

basicWithHighlightVSCodeRev.cardTemplates = basicWithHighlightVSCode.cardTemplates.concat({
  Name: "Card 2",
  Front: '<link rel="stylesheet" href="_vscodeAnkiPlugin.css" />{{Back}}',
  Back: "{{Back}}\n\n<hr id=answer>\n\n{{Front}}",
});

// Collection of models
const models = [basicWithHighlightVSCode, basicWithHighlightVSCodeRev];

export async function updateTemplate(ctx: IContext, model: any) {
  getLogger().info(`Updating ${model.modelName} in Anki`);
  let result;
  try {
    // There seems to be an issue here with updating the model silently failing
    // Check to see if there's any errors from this API call
    // https://github.com/jasonwilliams/anki/issues/59
    result = await ctx.ankiService.updateModelTemplate(model);
  } catch (e: any) {
    getLogger().error(`updating the template has failed: ${e}`);
    getLogger().error(e);
    result = false;
  }
  if (result === null) {
    getLogger().info(`Updating ${model.modelName} successful`);
  } else {
    getLogger().error(`Updating ${model.modelName} failed: ${result}`);
  }
}

// Is our note type installed on Anki?
export async function isTemplateInstalled(ctx: IContext, model: any): Promise<boolean> {
  const modelNames: string[] = await ctx.ankiService.modelNames();
  return modelNames.includes(model.modelName);
}
/**
 * Check if the template exists, if not create it, if it does exist update it
 */
export async function createOrUpdateTemplates(ctx: IContext) {
  models.forEach(async (model) => {
    getLogger().info(`Checking if ${model.modelName} exists as a model in Anki`);

    if (await isTemplateInstalled(ctx, model)) {
      getLogger().info(`${model.modelName} found in Anki`);
      await updateTemplate(ctx, model);
      return;
    } else {
      getLogger().info(`${model.modelName} was not found in Anki. Will attempt to upload..`);
      let result;
      try {
        result = await ctx.ankiService.createModel(model);
        getLogger().info(`createModel response: ${result}`);
      } catch (e) {
        getLogger().error(`Creating the template on Anki has failed: ${e}`);
        throw new Error(`Failed to upload template! ${e}`);
      }

      if (result.error) {
        getLogger().error(`Failed to upload template: ${result.error}`);
        throw new Error("Failed to upload template!");
      }
    }
  });
}
