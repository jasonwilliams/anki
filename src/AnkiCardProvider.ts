import { join } from "path";
import {
  TreeItemCollapsibleState,
  TreeItem,
  ExtensionContext,
  TreeDataProvider,
  window,
  Uri,
} from "vscode";
import { AnkiService } from "./AnkiService";
import { IContext } from "./extension";
import { AnkiFS } from "./fileSystemProvider";
import { getAnkiState } from "./state";
import { TextEncoder } from "util";

export class AnkiCardProvider implements TreeDataProvider<Dependency> {
  private ankiService: AnkiService;
  private context: ExtensionContext;
  private ankiFS: AnkiFS;
  private state: any;

  constructor(extContext: IContext) {
    this.ankiService = extContext.ankiService;
    this.context = extContext.context;
    if (!extContext?.getAnkiFS) {
      throw new Error("Anki Error: initialised AnkiFS/AnkiState is required");
    }

    this.ankiFS = extContext.getAnkiFS();
  }

  getTreeItem(element: Dependency): TreeItem {
    return element;
  }

  async getChildren(element?: Dependency) {
    // get children of Deck
    if (element) {
      if (element.uri === "anki:/templates") {
        return this.getAllModels();
      }

      if (element.uri.match(new RegExp("anki:/templates/w+"))) {
        const uri = element.uri;
        const model = element.uri.replace("anki:/templates/", "");
        this.getModelTemplates(model);
      }

      let cards;
      try {
        cards = await this.ankiService.findCards(`\"deck:${element.label}\"`);
      } catch (e) {}

      return cards?.map((v, i) => {
        const deckID = getAnkiState().getDeckIDFromName(v.deckName || "");
        const cardUri = `anki:/decks/${deckID}/${v.id?.toString()}.json`;
        this.ankiFS.writeFile(Uri.parse(cardUri), Buffer.from(v.toString()), {
          create: true,
          overwrite: true,
        });
        return new Dependency(
          v.question,
          v.id?.toString() ?? i.toString(),
          TreeItemCollapsibleState.None,
          cardUri
        );
      });
    }

    /** Top level */

    // Create top level directories in the virtual file system.
    this.ankiFS.createDirectory(Uri.parse("anki:/templates"));
    this.ankiFS.createDirectory(Uri.parse("anki:/decks"));
    let decks;

    try {
      decks = await this.ankiService.deckNamesAndIds();
    } catch (e) {
      window.showErrorMessage("Failed to get any Anki Decks");
      return;
    }

    const deps = decks.map((v, i) => {
      // Create a directory for this deck in the file system
      // this.ankiService.getDeckNameFromId(v.id?.toString() || "", this.state);
      this.ankiFS.createDirectory(Uri.parse(`anki:/decks/${v.id?.toString()}`));
      return new Dependency(
        v.name,
        v.id?.toString(10) || i.toString(),
        TreeItemCollapsibleState.Collapsed,
        `anki:/decks/${v.id?.toString(10)}`,
        this.getIconPath("deck")
      );
    });

    const templates = new Dependency(
      "__Templates__",
      "000000",
      TreeItemCollapsibleState.Collapsed,
      "anki:/templates",
      this.getIconPath("collection")
    );

    deps.unshift(templates);

    return deps;
  }

  /** Fetch all models and return wrapped Dependency's */
  async getAllModels(): Promise<Dependency[]> {
    const models = await this.ankiService.modelNamesAndIds();

    let templateDeps: Dependency[] = [];
    for (const [key, value] of Object.entries(models)) {
      // Add all the models to the file system as folders
      // Normally I would use id here but the API queries are done by name
      this.ankiFS.createDirectory(Uri.parse(`anki:/templates/${key}`));
      templateDeps.push(
        new Dependency(
          key,
          value.toString(),
          TreeItemCollapsibleState.Collapsed,
          `anki:/templates/${key}`,
          this.getIconPath("noteType")
        )
      );
    }

    return templateDeps;
  }

  async getModelTemplates(model: string) {
    console.log(model);
  }

  getIconPath(iconName: string): object {
    return {
      light: join(
        this.context.extensionPath,
        "src",
        "resources",
        "icons",
        "light",
        `${iconName}.svg`
      ),
      dark: join(
        this.context.extensionPath,
        "src",
        "resources",
        "icons",
        "dark",
        `${iconName}.svg`
      ),
    };
  }
}

class Dependency extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public uri: string,
    public iconPath?: any
  ) {
    super(label, collapsibleState);
    this.uri = uri;
    this.command = {
      command: "anki.treeItem",
      arguments: [this.uri, this.label],
      title: "Open",
    };
    this.iconPath = iconPath;
  }

  get tooltip(): string {
    return `${this.label}-${this.id}`;
  }

  get description(): string {
    return this.label;
  }
}
