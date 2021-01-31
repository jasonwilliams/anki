import { Transformer } from "./markdown/transformer";
import { MarkdownFile } from "./models/MarkdownFile";
import { window, Uri } from 'vscode';
import { IContext } from "./extension";


export async function sendFile(uri: Uri, ctx: IContext) {
    try {
        const file = new MarkdownFile(uri);
        await file.load(); // must call to read prior to transform
        try {
            await new Transformer(file, ctx.ankiService, true).transform();
        } catch (e) {
            window.showErrorMessage(e.toString());
        }
    } catch(e)   {
        window.showErrorMessage(`Unable to read ${uri.fsPath}`);
    }    
}
          