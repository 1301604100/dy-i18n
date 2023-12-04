import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

const project = ["chikii", "bikii"];
const i18nDirName = "i18n";
const langYmlName = "lang.yml";

// 获取正确的 hover 单词，如：t("xxx")
export function getCorrectSelectedWord(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const tRegexp = /t\(["'](.*?)["']\)/g;
  // 获取 hover 的行
  const lineText = document.lineAt(position).text;
  console.log("---lineText", lineText);

  let hoverWord = null;
  let matcher = null;
  while ((matcher = tRegexp.exec(lineText))) {
    let word = matcher[1];
    console.log("--- word:", word);
    // 有效区间    两括号 两引号 所以加 4
    let rang = [matcher.index, matcher.index + word.length + 4];
    console.log("---rang:", rang);
    if (position.character >= rang[0] && position.character <= rang[1]) {
      hoverWord = word;
      break;
    }
  }
  console.log("--- hoverWord:", hoverWord);

  return hoverWord;
}

// 获取正确的 hover 单词，如：t("xxx")
function getCorrectSelectedWord2(
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

  const tRegexp = /t\(["'](.*?)["']\)/g;
  const lineText = document.lineAt(position).text;
  console.log("---lineText", lineText);

  let matcher = null;
  while ((matcher = tRegexp.exec(lineText))) {
    if (matcher[1] === word) {
      return word;
    }
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

  return word;
}

// 找到项目下的 lang.yml
export function findLangYml(pathName: string) {
  console.log("---pathName", pathName);

  const i18nDir = find(pathName);
  console.log("---i18nDir:", i18nDir);
  if (!i18nDir) {
    return null;
  }

  return path.resolve(i18nDir, `./${langYmlName}`);

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

export async function getFileText(pathName: string) {
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