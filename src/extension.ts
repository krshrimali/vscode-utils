// extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('tgkrsutil');
    
    context.subscriptions.push(
        vscode.commands.registerCommand('tgkrsutil.runTest', () => runTest(false)),
        vscode.commands.registerCommand('tgkrsutil.runTestNewTerminal', () => runTest(true)),
        vscode.commands.registerCommand('tgkrsutil.copyTestCommand', copyTestCommand),
        vscode.commands.registerCommand('tgkrsutil.copyParentFunction', () => copyParentSymbol(vscode.SymbolKind.Function)),
        vscode.commands.registerCommand('tgkrsutil.copyParentClass', () => copyParentSymbol(vscode.SymbolKind.Class)),
        vscode.commands.registerCommand('tgkrsutil.showFunctionSignature', showSymbolSignature),
        vscode.commands.registerCommand('tgkrsutil.showClassSignature', showSymbolSignature)
    );
}

async function getParentSymbol(kind: vscode.SymbolKind) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        editor.document.uri
    );

    function findSymbol(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
        for (const symbol of symbols) {
            if (symbol.range.contains(position) && symbol.kind === kind) {
                return symbol;
            }
            if (symbol.children.length > 0) {
                const childSymbol = findSymbol(symbol.children, position);
                if (childSymbol) return childSymbol;
            }
        }
    }

    return symbols ? findSymbol(symbols, editor.selection.active) : undefined;
}

async function runTest(newTerminal: boolean) {
    const symbol = await getParentSymbol(vscode.SymbolKind.Function);
    if (!symbol) {
        vscode.window.showErrorMessage('No test function found');
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const filePath = editor.document.uri.fsPath;
    const testCmd = `pytest "${filePath}" -k "${symbol.name}"`;

    if (newTerminal) {
        const terminal = vscode.window.createTerminal('Test Runner');
        terminal.show();
        terminal.sendText(testCmd);
    } else {
        const existingTerminal = vscode.window.terminals.find(t => t.name === 'Test Runner');
        const terminal = existingTerminal || vscode.window.createTerminal('Test Runner');
        terminal.show();
        terminal.sendText(testCmd);
    }
}

async function copyTestCommand() {
    const symbol = await getParentSymbol(vscode.SymbolKind.Function);
    if (!symbol) {
        vscode.window.showErrorMessage('No test function found');
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const filePath = editor.document.uri.fsPath;
    const testCmd = `pytest "${filePath}" -k "${symbol.name}"`;
    
    vscode.env.clipboard.writeText(testCmd);
    vscode.window.showInformationMessage('Test command copied to clipboard');
}

async function copyParentSymbol(kind: vscode.SymbolKind) {
    const symbol = await getParentSymbol(kind);
    if (!symbol) {
        vscode.window.showErrorMessage(`No parent ${vscode.SymbolKind[kind]} found`);
        return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const range = new vscode.Range(
        symbol.range.start.line,
        symbol.range.start.character,
        symbol.range.end.line,
        symbol.range.end.character
    );

    const text = editor.document.getText(range);
    vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage(`${vscode.SymbolKind[kind]} copied to clipboard`);
}

async function showSymbolSignature() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        editor.document.uri
    );

    const position = editor.selection.active;
    let signature = '';

    function findSignature(symbols: vscode.DocumentSymbol[]): boolean {
        return symbols.some(symbol => {
            if (symbol.range.contains(position)) {
                if (symbol.kind === vscode.SymbolKind.Function || 
                    symbol.kind === vscode.SymbolKind.Class) {
                    signature = `${symbol.name}${symbol.detail ? ` ${symbol.detail}` : ''}`;
                    return true;
                }
                if (symbol.children.length > 0 && findSignature(symbol.children)) {
                    return true;
                }
            }
            return false;
        });
    }

    if (symbols && findSignature(symbols)) {
        const message = `🔹 ${signature}\n🔹 File: ${editor.document.fileName}`;
        vscode.window.showInformationMessage(message, { modal: true });
    } else {
        vscode.window.showInformationMessage('No signature found at cursor');
    }
}