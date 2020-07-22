import { join } from "path";
import * as vscode from "vscode";
import { AnkiService } from "./AnkiService";

export class AnkiCardProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private ankiService: AnkiService) {}

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (element) {
      // get children of a deck
    }
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return `${this.label}-${this.version}`;
  }

  get description(): string {
    return this.version;
  }

  iconPath = {
    light: join(__filename, "..", "..", "resources", "light", "dependency.svg"),
    dark: join(__filename, "..", "..", "resources", "dark", "dependency.svg"),
  };
}
