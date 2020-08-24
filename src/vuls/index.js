#!/usr/bin/env node
const axios = require('axios');

const base_url = 'https://www.npmjs.com/advisories';

async function pullDetailAdvisories() {
  const _t1 = process.uptime();
  console.log('Start pull security advisories.');
  const all_vuls = [];
  let pageNum = 0;
  let perPageNum = 100;
  let isLoop = true;
  let total_num = 1429;
  let pulled_num = 0;
  while(isLoop) {
    try {
      const result = await axios.get(base_url + '?page=' + pageNum.toString() + '&perPage=' + perPageNum.toString(),
      {
        headers: {
            'x-requested-with': 'XMLHttpRequest',
            'x-spiferack': '1',
        },
      });
      const data_json = result.data;
      total_num = data_json.advisoriesData.total;
      const objects = data_json.advisoriesData.objects;
      if (objects && objects.length > 0) {
        pulled_num += objects.length;
        const process = (pulled_num/total_num)*100;
        console.log(`Data pull progress: ${process.toString().substring(0, 5)}%`);
        if (objects.length < 100) {
          isLoop = false;
        }
        
        for (const vul_obj of objects) {
          all_vuls.push({
            id: vul_obj['id'],
            created: vul_obj['created'],
            updated: vul_obj['updated'],
            deleted: vul_obj['deleted'],
            title: vul_obj['title'],
            module_name: vul_obj['module_name'],
            cves: vul_obj['cves'],
            vulnerable_versions: vul_obj['vulnerable_versions'],
            patched_versions: vul_obj['patched_versions'],
            overview: vul_obj['overview'],
            recommendation: vul_obj['recommendation'],
            references: vul_obj['references'],
            access: vul_obj['access'],
            severity: vul_obj['severity'],
            cwe: vul_obj['cwe'],
            url: `${base_url}/${vul_obj['id']}`
          });
        }
      }
      pageNum += 1;
    } catch (error) {
      console.log(error);
      break;
    }
  }
  const _t2 = process.uptime();
  console.log(`End. Security advisories size ${all_vuls.length}. Consume time: ${_t2 - _t1}s.`);
  return all_vuls;
}

module.exports = { pullDetailAdvisories }

// let simple_vulnerable_versions = {};
// pullDetailAdvisories().then(results => {
//   for (const _item of results) {
//     simple_vulnerable_versions[_item['module_name']] = _item['vulnerable_versions'];
//   }
//   console.log(JSON.stringify(simple_vulnerable_versions));
// });