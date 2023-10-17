import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";

const project = ["chikii", "bikii"];
const i18nDirName = "i18n";
const langYamlName = "lang.yaml";

export function activate(context: vscode.ExtensionContext) {
  const hoverProvider = vscode.languages.registerHoverProvider(
    ["typescript", "vue"],
    {
      async provideHover(document, position, token) {
        // hover 的单词
        const word = getCorrectSelectedWord(document, position);
        if (!word) {
          return null;
        }

        const langYamlPath = findLangYaml(
          path.resolve(document.fileName, "../")
        );
        console.log("---langYamlPath:", langYamlPath);
        if (!langYamlPath) {
          return null;
        }

        const langYamlText = await getFileText(langYamlPath);
        // console.log("---langYamlText:", langYamlText);
        if (!langYamlText) {
          return null;
        }

        const langObj = yaml.load(langYamlText) as Record<
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
        const langYamlPath = findLangYaml(
          path.resolve(document.fileName, "../")
        );
        console.log("---langYamlPath:", langYamlPath);
        if (!langYamlPath) {
          return null;
        }

        const langYamlContent = await getFileText(langYamlPath);
        // console.log("---langYamlContent:", langYamlContent);
        if (!langYamlContent) {
          return null;
        }

        // 查找目标字符的位置
        const targetIndex = langYamlContent.indexOf(word);

        if (targetIndex === -1) {
          return null;
        }

        // 如果找到目标字符，将其位置转换为行和列
        const lines = langYamlContent.substring(0, targetIndex).split("\n");
        const lineNumber = lines.length;
        const column = lines[lines.length - 1].length;
        console.log("---lineNumber, column:", lineNumber, column);

        // 创建 Position 对象
        const p = new vscode.Position(lineNumber - 1, column);

        return new vscode.Location(vscode.Uri.file(langYamlPath), p);
      },
    }
  );

  context.subscriptions.push(hoverProvider, definitionProvider);
}

// 获取正确的 hover 单词，如：t("xxx")
function getCorrectSelectedWord(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  // console.log("--- document, position", document, position);
  // 整个文件字符长度
  const documentLen = document.getText().length;
  // hover 的单词
  const rang = document.getWordRangeAtPosition(position);
  // console.log("--- rang:", rang);
  const word = document.getText(rang);
  // 没有 hover 单词
  if (word.length === documentLen || !rang) {
    return null;
  }
  const startCharNum = rang.start.character; // 开始字符位置
  const endCharNum = rang.end.character; // 结束字符位置
  // 超出范围
  if (startCharNum - 3 < 0 || endCharNum + 2 > documentLen) {
    return null;
  }
  console.log("---word", word);
  // 在第几行
  const lineNum = rang.start.line;
  // t("xxx")
  const fullWord = document.getText(
    new vscode.Range(
      new vscode.Position(lineNum, rang.start.character - 3),
      new vscode.Position(lineNum, rang.end.character + 2)
    )
  );
  console.log("---fullWord:", fullWord);
  // 不匹配
  if (fullWord !== `t("${word}")` && fullWord !== `t('${word}')`) {
    return null;
  }
  const lineText = document.lineAt(position).text;
  console.log("---lineText", lineText);
  return word;
}

// 找到项目下的 lang.yaml
function findLangYaml(pathName: string) {
  console.log("---pathName", pathName);

  const i18nDir = find(pathName);
  console.log("---i18nDir:", i18nDir);
  if (!i18nDir) {
    return null;
  }

  return path.resolve(i18nDir, `./${langYamlName}`);

  function find(pathName: string) {
    try {
      if (project.includes(path.dirname(pathName))) {
        return null;
      }
      const subDirectories = fs.readdirSync(pathName).filter((item) => {
        return fs.statSync(path.join(pathName, item)).isDirectory();
      });

      console.log("---subDirectories", subDirectories);

      for (const directory of subDirectories) {
        if (directory === i18nDirName) {
          return path.resolve(pathName, `./${i18nDirName}`);
        }
      }

      return find(path.resolve(pathName, "../"));
    } catch (err) {
      console.error("Error reading directory: ", err);
    }
  }
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

// This method is called when your extension is deactivated
export function deactivate() {}
