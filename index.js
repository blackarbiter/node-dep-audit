'use strict';
const { Dependency } = require('./src/package/index');
const { pullDetailAdvisories } = require('./src/vuls/index');
const { writeJson } = require('./src/utils/json');

const dependency = new Dependency();
const base_url = 'https://www.npmjs.com/advisories';

const run = () => {
  console.log(`
  -------------------------------------------------------
  内推各类社会招聘职位: https://job.bytedance.com/society/position,
  欢迎发送简历到邮箱: zpzpzp188#163.com，请备注具体职位信息。
  字节跳动校招内推码: E9WCMGX 投递链接: https://job.toutiao.com/s/JkHY69B
  -------------------------------------------------------
  `);
  const argv = require('yargs')
    .options({
      'pk': {
        alias: 'package',
        describe: 'File path of package.json.',
        type: 'string',
        demandOption: true
      },
      'lockPk': {
        alias: 'lockPackage',
        describe: 'File path of package-lock.json.',
        type: 'string',
        demandOption: true
      },
      'd': {
        alias: 'deep',
        default: 3,
        describe: 'Recursion depth for find dependency list.',
        type: 'number'
      },
      'o': {
        alias: 'output',
        describe: 'File to store results, type must be .json.',
        type: 'string'
      }
    })
    .help('help')
    .argv;

  pullDetailAdvisories().then(vuls => {
    const results = {
      secAdvisories: vuls
    };
    const packageFilePath = argv.pk;
    const lockPackageFilePath = argv.lockPk;
    const dependencyDeep = argv.deep;
    dependency.startAnalysis(results, packageFilePath, lockPackageFilePath, dependencyDeep);
    const dependency_lists = results['dependencyLists'];
    const output = argv.output;
    const detail_results = [];
    for (const _list of dependency_lists) {
      let dep_list_str = '';
      let is_dev = false;
      for (let i=_list.length-1; i>-1; i--) {
        dep_list_str = `${dep_list_str} > ${_list[i].name}`;
        if (!is_dev && _list[i].isDev) {
          is_dev = true;
        }
      }
      dep_list_str = dep_list_str.substring(2).trim();
      const first_item = _list[0];
      const detail_advisory = vuls[first_item.vulIndex];
      detail_results.push({
        'Severity': detail_advisory['severity'],
        'Package': first_item['name'],
        'Version': first_item['version'],
        'VulnerableVersion': detail_advisory['vulnerable_versions'],
        'PatchedVsersion': detail_advisory['patched_versions'],
        'DependencyPath': dep_list_str,
        'Dev': first_item['isDev'],
        'MoreInfo': `${base_url}/${detail_advisory['id']}`
      });
    }
    if (output) {
      writeJson(output, detail_results);
      console.log(`Write results to ${output} finished.`);
    } else {
      console.log(`
        ---------------------------------------------------------
        Result Size      : ${detail_results.length}
        ---------------------------------------------------------`);
      for (const detail_item of detail_results) {
        console.log(`
        ---------------------------------------------------------
        Severity         : ${detail_item['Severity']}
        Package          : ${detail_item['Package']}
        Version          : ${detail_item['Version']}
        VulnerableVersion: ${detail_item['VulnerableVersion']}
        PatchedVsersion  : ${detail_item['PatchedVsersion']}
        DependencyPath   : ${detail_item['DependencyPath']}
        Dev              : ${detail_item['Dev']}
        MoreInfo         : ${detail_item['MoreInfo']}
        ---------------------------------------------------------`);
      }
    }
  });
}

async function api(packageFilePath, lockPackageFilePath, dependencyDeep=3) {
  const vuls = await pullDetailAdvisories();
  const results = {
    secAdvisories: vuls
  }
  const detail_results = [];
  dependency.startAnalysis(results, packageFilePath, lockPackageFilePath, dependencyDeep);
  const dependency_lists = results['dependencyLists'];
  for (const _list of dependency_lists) {
    let dep_list_str = '';
    let is_dev = false;
    for (let i=_list.length-1; i>-1; i--) {
      dep_list_str = `${dep_list_str} > ${_list[i].name}`;
      if (!is_dev && _list[i].isDev) {
        is_dev = true;
      }
    }
    dep_list_str = dep_list_str.substring(2).trim();
    const first_item = _list[0];
    const detail_advisory = vuls[first_item.vulIndex];
    detail_results.push({
      'Severity': detail_advisory['severity'],
      'Package': first_item['name'],
      'Version': first_item['version'],
      'VulnerableVersion': detail_advisory['vulnerable_versions'],
      'PatchedVsersion': detail_advisory['patched_versions'],
      'DependencyPath': dep_list_str,
      'Dev': first_item['isDev'],
      'MoreInfo': `${base_url}/${detail_advisory['id']}`
    });
  }
  return detail_results;
}

module.exports = { run, api }