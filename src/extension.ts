// extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('tgkrsutil');

    context.subscriptions.push(
        vscode.commands.registerCommand('tgkrsutil.runTest', () => runTest(false)),
        vscode.commands.registerCommand('tgkrsutil.runTestNewTerminal', () => runTest(true)),
        vscode.commands.registerCommand('tgkrsutil.copyTestCommand', copyTestCommand),
        vscode.commands.registerCommand('tgkrsutil.copyParentFunction', () => copyParentSymbol([vscode.SymbolKind.Function, vscode.SymbolKind.Method])),
        vscode.commands.registerCommand('tgkrsutil.copyParentClass', () => copyParentSymbol([vscode.SymbolKind.Class])),
        vscode.commands.registerCommand('tgkrsutil.showFunctionSignature', showSymbolSignature),
        vscode.commands.registerCommand('tgkrsutil.showClassSignature', showSymbolSignature),
        vscode.commands.registerCommand('tgkrsutil.debugSymbols', debugSymbols)
    );
}

async function getParentSymbol(kinds: vscode.SymbolKind | vscode.SymbolKind[]) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        editor.document.uri
    );

    if (!symbols) return undefined;

    const position = editor.selection.active;
    const targetKinds = Array.isArray(kinds) ? kinds : [kinds];

    function findSymbolRecursive(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol | undefined {
        let bestMatch: vscode.DocumentSymbol | undefined = undefined;

        for (const symbol of symbols) {
            // Check if position is within this symbol's range
            if (symbol.range.contains(position)) {
                // If this symbol matches any of our target kinds, it's a potential match
                if (targetKinds.includes(symbol.kind)) {
                    bestMatch = symbol;
                }

                // Always search children for a more specific match
                const childMatch = findSymbolRecursive(symbol.children);
                if (childMatch) {
                    return childMatch; // Child match is more specific
                }
            }
        }

        return bestMatch;
    }

    return findSymbolRecursive(symbols);
}

async function debugSymbols() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        editor.document.uri
    );

    if (!symbols) {
        vscode.window.showErrorMessage('No symbols found');
        return;
    }

    const position = editor.selection.active;

    function buildSymbolTree(symbols: vscode.DocumentSymbol[], depth = 0): string {
        let result = '';
        const indent = '  '.repeat(depth);

        for (const symbol of symbols) {
            const contains = symbol.range.contains(position) ? ' [CONTAINS CURSOR]' : '';
            const kindName = vscode.SymbolKind[symbol.kind];
            result += `${indent}${symbol.name} (${kindName})${contains}\n`;
            result += `${indent}  Range: ${symbol.range.start.line}:${symbol.range.start.character} - ${symbol.range.end.line}:${symbol.range.end.character}\n`;

            if (symbol.children.length > 0) {
                result += buildSymbolTree(symbol.children, depth + 1);
            }
        }
        return result;
    }

    const symbolTree = buildSymbolTree(symbols);
    const cursorInfo = `Cursor at: ${position.line}:${position.character}\n\n`;

    // Show in a new document
    const doc = await vscode.workspace.openTextDocument({
        content: cursorInfo + symbolTree,
        language: 'plaintext'
    });
    await vscode.window.showTextDocument(doc);
}

async function runTest(newTerminal: boolean) {
    // Look for both Function and Method symbols (Method is used for class methods in Python)
    const symbol = await getParentSymbol([vscode.SymbolKind.Function, vscode.SymbolKind.Method]);
    if (!symbol) {
        vscode.window.showErrorMessage('No test function found. Run "Debug Symbols" command to see available symbols.');
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
    const symbol = await getParentSymbol([vscode.SymbolKind.Function, vscode.SymbolKind.Method]);
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

async function copyParentSymbol(kinds: vscode.SymbolKind[]) {
    const symbol = await getParentSymbol(kinds);
    if (!symbol) {
        const kindNames = kinds.map(k => vscode.SymbolKind[k]).join(' or ');
        vscode.window.showErrorMessage(`No parent ${kindNames} found`);
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
    const kindName = vscode.SymbolKind[symbol.kind];
    vscode.window.showInformationMessage(`${kindName} copied to clipboard`);
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
                    symbol.kind === vscode.SymbolKind.Method ||
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
