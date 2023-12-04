import * as vscode from "vscode";

import { getWebviewProvider } from "./WebViewProvider";
import { hoverProvider, definitionProvider } from "./HoverProvider";
import MyCompletionItemProvider from "./MyCompletionItemProvider";

export function activate(context: vscode.ExtensionContext) {
  const webviewProvider = getWebviewProvider(context);

  context.subscriptions.push(
    hoverProvider, // hover 显示多语言内容
    definitionProvider, // 快速跳转
    webviewProvider // webview
  );
  const provider = new MyCompletionItemProvider();
  vscode.languages.registerCompletionItemProvider(
    [
      { scheme: "file", language: "vue" },
      { scheme: "file", language: "typescript" },
    ],
    provider,
    '"', `'`
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

