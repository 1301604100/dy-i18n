import * as vscode from "vscode";
import * as path from "node:path";
import * as yaml from "js-yaml";
import { findLangYml, getCorrectSelectedWord, getFileText } from "./utils";

const hoverProvider = vscode.languages.registerHoverProvider(
  ["typescript", "vue"],
  {
    async provideHover(document, position, token) {
      // hover 的单词
      const word = getCorrectSelectedWord(document, position);
      if (!word) {
        return null;
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
      // console.log("---langObj:", langObj);

      const obj = langObj[word];
      console.log("---obj", obj);

      let resStr = "";
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          resStr += `- **${key}:**    ${obj[key]}  \n`;
        }
      }
      console.log("---resStr:", resStr);
      return new vscode.Hover(resStr);
    },
  }
);

const definitionProvider = vscode.languages.registerDefinitionProvider(
  ["typescript", "vue"],
  {
    async provideDefinition(document, position, token) {
      const word = getCorrectSelectedWord(document, position);
      if (!word) {
        return null;
      }
      const langYmlPath = findLangYml(path.resolve(document.fileName, "../"));
      console.log("---langYmlPath:", langYmlPath);
      if (!langYmlPath) {
        return null;
      }

      const langYmlContent = await getFileText(langYmlPath);
      // console.log("---langYmlContent:", langYmlContent);
      if (!langYmlContent) {
        return null;
      }

      // 查找目标字符的位置
      const targetIndex = langYmlContent.indexOf(word);

      if (targetIndex === -1) {
        return null;
      }

      // 如果找到目标字符，将其位置转换为行和列
      const lines = langYmlContent.substring(0, targetIndex).split("\n");
      const lineNumber = lines.length;
      const column = lines[lines.length - 1].length;
      console.log("---lineNumber, column:", lineNumber, column);

      // 创建 Position 对象
      const p = new vscode.Position(lineNumber - 1, column);

      return new vscode.Location(vscode.Uri.file(langYmlPath), p);
    },
  }
);

export { hoverProvider, definitionProvider };
