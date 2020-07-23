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
        cards = await this.ankiService.findCards(`deck:${element.label}`);
      } catch (e) {
        console.log(e);
      }

      return cards?.map((v) => {
        return new Dependency(
          v.question,
          v.question,
          vscode.TreeItemCollapsibleState.None
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

    const deps = decks.map((v) => {
      return new Dependency(
        v.name,
        v.id?.toString(10) || "0",
        vscode.TreeItemCollapsibleState.Collapsed
      );
    });

    return deps;
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly id: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
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
