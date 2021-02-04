import { Transformer } from "./markdown/transformer";
import { MarkdownFile } from "./models/MarkdownFile";
import { window, Uri } from 'vscode';
import { IContext } from "./extension";
import { SendDiff } from "./models/SendDiff";


export async function sendFile(uri: Uri, ctx: IContext, isAutoSend: boolean): Promise<SendDiff | boolean> {
    try {
        const file = new MarkdownFile(uri);
        await file.load(); // must call to read prior to transform
        if (isAutoSend && !file.autoSend) {
            return false;
        }
        try {
            return await new Transformer(file, ctx.ankiService, true).transform();
        } catch (e) {
            console.log("transform error",e);
            window.showErrorMessage(e.toString());
            return false;
        }
    } catch(e)   {
        window.showErrorMessage(`Unable to read ${uri.fsPath}`);
        return false;
    }
}
          