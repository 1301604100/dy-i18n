/* const fs = require("fs");

const langYamlContent = fs.readFileSync(
  "d:\\code\\other\\test-pb2api\\chikii\\test\\lang.yaml",
  "utf-8"
);
console.log("🚀 ~ file: index.js:5 ~ langYamlContent:", langYamlContent); */

  const tRegexp = /t\(["'](.*?)["']\)/g;
  const lineText = '<div>{{ t("hello") }}</div><div>{{ t("hello") }}</div>';

  let matcher = null;
  while ((matcher = tRegexp.exec(lineText))) {
    console.log("🚀 ~ file: index.js:15 ~ matcher:", matcher);
  }