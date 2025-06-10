# TGKRS Util

**TGKRS Util** is a lightweight VSCode extension to streamline Python test development, particularly for `pytest`. It provides utilities to quickly run tests, inspect symbols, and copy code structures with ease.

## Features

- **Run Pytest Function Under Cursor**
  Run the nearest test function or method using `pytest`, in a new or existing terminal.

- **Copy Pytest Command**
  Generate and copy a `pytest` command based on the function or method at the cursor.

- **Copy Parent Function or Class**
  Copies the source of the nearest enclosing function/method or class.

- **Show Signature**
  Displays the signature of the function, method, or class at the cursor position.

- **Debug Document Symbols**
  Shows a structured symbol tree for the current file, highlighting which symbols contain the cursor.

## Available Commands

| Command ID                          | Description |
|------------------------------------|-------------|
| `tgkrsutil.runTest`                | Run the nearest test in an existing terminal |
| `tgkrsutil.runTestNewTerminal`     | Run the nearest test in a new terminal |
| `tgkrsutil.copyTestCommand`        | Copy a `pytest` command for the nearest test |
| `tgkrsutil.copyParentFunction`     | Copy the nearest enclosing function or method |
| `tgkrsutil.copyParentClass`        | Copy the nearest enclosing class |
| `tgkrsutil.showFunctionSignature`  | Show the function/method signature at the cursor |
| `tgkrsutil.showClassSignature`     | Show the class signature at the cursor |
| `tgkrsutil.debugSymbols`           | Open a document displaying the symbol tree and cursor position |

## Usage

1. Open a Python file in VSCode.
2. Place the cursor inside a function, method, or class.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type `TGKRS Util` to access the commands.

Alternatively, configure keyboard shortcuts or use the context menu if available.

## Example: Debug Symbols Output

```
Cursor at: 15:8

MyClass (Class)
  Range: 5:0 - 50:0
  my_test_method (Method) [CONTAINS CURSOR]
    Range: 10:4 - 20:8
```

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view (`Ctrl+Shift+X`).
3. Search for "TGKRS Util".
4. Click "Install".

## License

MIT License
