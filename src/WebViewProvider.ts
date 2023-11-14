import * as vscode from "vscode";
import * as path from "node:path";
import * as yaml from "js-yaml";

export function getWebviewProvider(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand(
    "dy-i18n.toSheet",
    async ({ path }) => {
      // console.log(" WebViewProvider.ts:7 ~ args:", path, context);
      // 追踪当前 webview 面板
      let currentPanel: vscode.WebviewPanel | null = null;

      // 获取当前活动的编辑器
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
      if (currentPanel) {
        // 如果我们已经有了一个面板，那就把它显示到目标列布局中
        (currentPanel as vscode.WebviewPanel).reveal(columnToShowIn);
      } else {
        // 不然，创建一个新面板
        currentPanel = vscode.window.createWebviewPanel(
          "sheet", // 只供内部使用，这个webview的标识
          "sheet", // 给用户显示的面板标题
          vscode.ViewColumn.One, // 给新的webview面板一个编辑器视图
          {
            retainContextWhenHidden: true, // 保证 Webview 所在页面进入后台时不被释放
            enableScripts: true, // 运行 JS 执行
          }
        );

        currentPanel.webview.html = await getWebviewContent(context);

        // 当前面板被关闭后重置
        currentPanel.onDidDispose(
          () => {
            currentPanel = null;
          },
          null,
          context.subscriptions
        );
      }

      const langObj = await getLangYmlObj(path);
      // console.log(" ~ langObj:", langObj);

      currentPanel.webview.postMessage({
        method: "init",
        data: langObj,
      });

      currentPanel.webview.onDidReceiveMessage(
        (message) => {
          // const text = yaml.dump(message.data, {
          //   quotingType: '"',
          // });
          // console.log(" ~ text:", text);

          const obj = message.data;
          let text = ``;
          if (!obj["langs"]) {
            vscode.window.showErrorMessage(`missing langs!`);
            return;
          }

          text += "langs:\n";
          for (const lang of obj["langs"]) {
            text += `  - ${lang}\n`;
          }

          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (key === "langs") {
                continue;
              }

              text += "\n";
              text += `${key}:\n`;

              for (const lang in obj[key]) {
                if (Object.prototype.hasOwnProperty.call(obj[key], lang)) {
                  text += `  ${lang}: "${obj[key][lang]}"\n`;
                }
              }
            }
          }

          vscode.workspace.fs
            .writeFile(vscode.Uri.file(path), Buffer.from(text))
            .then((...args) => {
              console.log("~ writeFile ~ args:", args);
            });
        },
        undefined,
        context.subscriptions
      );
    }
  );
}

async function getWebviewContent(context: vscode.ExtensionContext) {
  console.log("--- context.extensionPath:", context.extensionPath);
  const content = await vscode.workspace.fs.readFile(
    vscode.Uri.file(
      path.join(context.extensionPath, "src/i18n-sheet/index.html")
    )
  );
  const text = new TextDecoder().decode(content);
  return text;
}

async function getLangYmlObj(path: string) {
  const langYmlText = await getFileText(path);
  // console.log("---langYmlText:", langYmlText);
  if (!langYmlText) {
    return null;
  }

  const langObj = yaml.load(langYmlText) as Record<
    string,
    Record<string, string>
  >;

  return langObj;
}

async function getFileText(pathName: string) {
  try {
    const content = await vscode.workspace.fs.readFile(
      vscode.Uri.file(pathName)
    );
    const text = new TextDecoder().decode(content);
    return text;
  } catch (error) {
    return null;
  }
}
