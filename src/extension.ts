import * as vscode from "vscode";

import { getWebviewProvider } from "./WebViewProvider";
import { hoverProvider, definitionProvider } from "./HoverProvider";

export function activate(context: vscode.ExtensionContext) {
  const webviewProvider = getWebviewProvider(context);

  context.subscriptions.push(
    hoverProvider,
    definitionProvider,
    webviewProvider
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
