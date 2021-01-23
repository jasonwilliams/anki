import { Uri, workspace, window } from 'vscode';
import * as path from 'path';


export class MarkdownFile {
  public uri: Uri;
  public cachedContent: string;

  constructor(uri: Uri | null) {
    if (uri) {
      this.uri = uri;
    } else {
      if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0)
      {
        this.uri = workspace.workspaceFolders[0].uri;
      } else {
        this.uri = Uri.parse('.');
      }
    }    
    this.cachedContent = "";
  }

  async loadContent()
  {
    try {
        const rawData = await workspace.fs.readFile(this.uri);
        this.cachedContent = rawData.toString();
    }
    catch(e)
    {
        throw e;
    }
  }

  public dirPath()
  {
    return path.dirname(this.uri.fsPath);
  }

  public static fromActiveTextEditor(): MarkdownFile
  {
    const uri = window.activeTextEditor?.document.uri;
    let file;
    if (uri) {
      file = new MarkdownFile(uri);
    } else {
      file = new MarkdownFile(null);
    }
    file.cachedContent = window.activeTextEditor?.document.getText() ?? "";
    return file;
  }
}
