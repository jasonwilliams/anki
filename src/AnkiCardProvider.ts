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
      if (element.type === ItemType.TemplateFolder) {
        return this.getAllModels();
      }

      if (element.type === ItemType.Template) {
        const model = element.uri.replace("anki:/templates/", "");
        const styleDep = await this.getModelStyling(model);
        return [styleDep];
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
          cardUri,
          ItemType.Card
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
        ItemType.Deck,
        this.getIconPath("deck")
      );
    });

    const templates = new Dependency(
      "__Templates__",
      "000000",
      TreeItemCollapsibleState.Collapsed,
      "anki:/templates",
      ItemType.TemplateFolder,
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
          ItemType.Template,
          this.getIconPath("noteType")
        )
      );
    }

    return templateDeps;
  }

  async getModelStyling(model: string): Promise<Dependency> {
    const uri = `anki:/templates/${model}/styling.css`;
    const styling = await this.ankiService.modelStyling(model);
    this.ankiFS.writeFile(Uri.parse(uri), Buffer.from(styling.css), {
      create: true,
      overwrite: true,
    });
    const css = new Dependency(
      "styling.css",
      uri,
      TreeItemCollapsibleState.None,
      uri,
      ItemType.Css
    );

    return css;
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
    public type: ItemType,
    public iconPath?: any
  ) {
    super(label, collapsibleState);
    this.uri = uri;
    if (type === ItemType.Css || type === ItemType.Card) {
      this.command = {
        command: "anki.treeItem",
        arguments: [this.uri, this.label],
        title: "Open",
      };
    }
    this.iconPath = iconPath;
    this.type = type;
  }

  get tooltip(): string {
    return `${this.label}-${this.id}`;
  }

  get description(): string {
    return this.label;
  }
}

enum ItemType {
  DeckFolder,
  Deck,
  Card,
  TemplateFolder,
  Template,
  Css,
}
