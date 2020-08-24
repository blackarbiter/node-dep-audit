const fse = require('fs-extra');

function getCode(filePath) {
  if (filePath) {
    try {
      const code = fse.readFileSync(filePath, 'utf-8').toString();
      return code;
    } catch (error) {
      console.log(`get ${filePath} content failed.`, error);
      return '';
    }
  }
}

function parseJson(code) {
  let json_data = {};
  if (code.length == 0) {
    return json_data;
  }

  try {
    json_data = JSON.parse(code);
  } catch (error) {
    console.log('parse json file failed.', error);
  }
  return json_data;
}

function writeJson(filePath, jsonData) {
  try {
    fse.writeFileSync(filePath, JSON.stringify(jsonData), 'utf-8');
  } catch (error) {
    console.log(`write ${filePath} failed.`, error);
  }
}

module.exports = { getCode, parseJson, writeJson }