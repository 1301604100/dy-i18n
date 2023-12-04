import * as vscode from "vscode";
import * as path from "node:path";
import * as yaml from "js-yaml";

import { findLangYml, getCorrectSelectedWord, getFileText } from "./utils";

export default class MyCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    const word = getCorrectSelectedWord(document, position);

    if (word === null) {
      return [];
    }
    const langYmlPath = findLangYml(path.resolve(document.fileName, "../"));
    console.log("---langYmlPath:", langYmlPath);
    if (!langYmlPath) {
      return null;
    }

    const langYmlText = await getFileText(langYmlPath);
    // console.log("---langYmlText:", langYmlText);
    if (!langYmlText) {
      return null;
    }

    const langObj = yaml.load(langYmlText) as Record<
      string,
      Record<string, string>
    >;
    const completionItems = [];
    for (const key in langObj) {
      if (Object.prototype.hasOwnProperty.call(langObj, key)) {
        const item = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Value
        );
        let str = "";
        for (const lang in langObj[key]) {
          if (Object.prototype.hasOwnProperty.call(langObj[key], lang)) {
            str += `${lang}:  ${langObj[key][lang]}  \n`;
          }
        }
        item.detail = key;
        item.documentation = str;
        completionItems.push(item);
      }
    }
    return completionItems;
  }
}
