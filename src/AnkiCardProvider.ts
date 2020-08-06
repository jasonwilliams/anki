import { join } from "path";
import * as vscode from "vscode";
import { AnkiService } from "./AnkiService";
import { IContext } from "./extension";

export class AnkiCardProvider implements vscode.TreeDataProvider<Dependency> {
  private ankiService: AnkiService;
  private context: vscode.ExtensionContext;
  constructor(extContext: IContext) {
    this.ankiService = extContext.ankiService;
    this.context = extContext.context;
  }

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Dependency) {
    // get children of Deck
    if (element) {
      // as cards don't have children element would be a Deck or templates folder
      if (element.uri === "anki:/templates") {
        return this.getAllModels();
      }
      let cards;
      try {
        cards = await this.ankiService.findCards(`\"deck:${element.label}\"`);
      } catch (e) {}

      return cards?.map((v, i) => {
        return new Dependency(
          v.question,
          v.id?.toString() ?? i.toString(),
          vscode.TreeItemCollapsibleState.None,
          `anki:/${v.deckName}/${v.question}`
        );
      });
    }

    // Top level, get decks
    let decks;
    try {
      decks = await this.ankiService.deckNamesAndIds();
    } catch (e) {
      vscode.window.showErrorMessage("Failed to get any Anki Decks");
      return;
    }

    const deps = decks.map((v, i) => {
      return new Dependency(
        v.name,
        v.id?.toString(10) || i.toString(),
        vscode.TreeItemCollapsibleState.Collapsed,
        `anki:/decks/${v.name}`,
        this.getIconPath("deck")
      );
    });

    const templates = new Dependency(
      "__Templates__",
      "000000",
      vscode.TreeItemCollapsibleState.Collapsed,
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
      templateDeps.push(
        new Dependency(
          key,
          value.toString(),
          vscode.TreeItemCollapsibleState.Collapsed,
          `anki:/templates/${key}`,
          this.getIconPath("noteType")
        )
      );
    }

    return templateDeps;
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

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
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
