import { Uri, workspace, FileType } from "vscode";

// retrieves flat list of all markdown file uris in a workspace
export async function allMarkdownUri(): Promise<Uri[]>
{
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0)
    {
        try {
            const workspaceUri = workspace.workspaceFolders[0].uri;
            return markdownUri(workspaceUri, []);
            
        } catch(error)
        {
            throw error;
        }
    }
    return [];
} 

async function markdownUri(dirUri: Uri, acc: Uri[]): Promise<Uri[]>
{
    const dirContent = await workspace.fs.readDirectory(dirUri);
    for (let i = 0; i < dirContent.length; i++)
    {
        const uri = Uri.joinPath(dirUri, dirContent[i][0]);
        if (dirContent[i][1] == FileType.Directory) { 
            const subDirAcc = await markdownUri(uri, []);
            acc = acc.concat(subDirAcc);
        }
        else {
            if (uri.fsPath.slice(-3) == ".md") {
                acc.push(uri);
            }
        }
    }
    return acc;
}
