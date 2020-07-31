import { join } from "path";
import * as vscode from "vscode";
import { AnkiService } from "./AnkiService";

export class AnkiCardProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private ankiService: AnkiService) {}

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Dependency) {
    // get children of Deck
    if (element) {
      // as cards don't have children element would be a Deck
      let cards;
      try {
        cards = await this.ankiService.findCards(`\"deck:${element.label}\"`);
      } catch (e) {}

      return cards?.map((v, i) => {
        return new Dependency(
          v.question,
          v.id?.toString() ?? i.toString(),
          vscode.TreeItemCollapsibleState.None,
          `anki://${v.deckName}/${v.question}`
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
        `anki:/${v.name}`
      );
    });

    return deps;
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public uri: string
  ) {
    super(label, collapsibleState);
    this.uri = uri;
    this.command = {
      command: "anki.treeItem",
      arguments: [this.uri, this.label],
      title: "Open",
    };
  }

  get tooltip(): string {
    return `${this.label}-${this.id}`;
  }

  get description(): string {
    return this.label;
  }

  iconPath = {
    light: join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  };
}
