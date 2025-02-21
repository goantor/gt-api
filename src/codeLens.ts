import * as vscode from 'vscode';

export class RequestCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        vscode.workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (!vscode.workspace.getConfiguration('gtApi').get('enableCodeLens', true)) {
            return [];
        }

        this.codeLenses = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];
            
            // 检查当前行是否是 @method，且下一行是否是 HTTP 方法
            const methodMatch = line.match(/^@method\s*=\s*"[^"]+"$/);
            const httpMethodMatch = nextLine.match(/^\s*(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+/);
            
            if (methodMatch && httpMethodMatch) {
                const range = new vscode.Range(
                    new vscode.Position(i, 0),
                    new vscode.Position(i, line.length)
                );
                
                this.codeLenses.push(new vscode.CodeLens(range, {
                    title: "Execute",
                    command: "gt-api.Execute",
                    arguments: [range]
                }));
                
                this.codeLenses.push(new vscode.CodeLens(range, {
                    title: "Copy",
                    command: "gt-api.copyAsCurl",
                    arguments: [range]
                }));
                
                this.codeLenses.push(new vscode.CodeLens(range, {
                    title: "Save",
                    command: "gt-api.saveToCollection",
                    arguments: [range]
                }));
            }
        }
        
        return this.codeLenses;
    }

    public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
        return codeLens;
    }
} 