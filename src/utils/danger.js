
/**
 * Give package name and version, Determine whether there is a vulnerability.
 * @param {*} pkName package name.
 * @param {*} pkVersion package version.
 * @param {*} secAdvisories {module_name: vulnerable_version}, data extract from https://www.npmjs.com/advisories.
 */
function isVulJudge(pkName, pkVersion, secAdvisories) {
  let vul_index = -1;
  if (secAdvisories == null) {
    return isVul;
  }
  for (let i=0; i<secAdvisories.length; i++) {
    const module_name = secAdvisories[i]['module_name'];
    const vulnerable_versions = secAdvisories[i]['vulnerable_versions'];
    if (pkName == module_name) {
      const is_vul = innerJudge(pkVersion, vulnerable_versions);
      if (is_vul) {
        vul_index = i;
      }
    }
    if (vul_index > -1) {
      break;
    }
  }
  return vul_index;
}

function innerJudge(pkVersion, vulnerable_version) {
  const v_lists = vulnerable_version.split('||').map((key) => {
    const ii_list = key.trim().split(' ').map((key) => {
      return key.trim();
    });
    return ii_list;
  });
  let final_is_vul = false;
  const single_symbol = ['>', '>=', '<', '<=', '~'];
  for (const v_list of v_lists) {
    let judege_list = [];
    let last_index = 0;
    for (let i=0; i<v_list.length; i++) {
      const _item = v_list[i];
      if ((_item != '*') && (single_symbol.indexOf(_item.substring(0, 2)) == -1) && 
                            (single_symbol.indexOf(_item.substring(0, 1)) == -1) &&
                            (_item.trim() != '')) {
        let _sst = '';
        for (let j=last_index; j<=i; j++) {
          _sst = `${_sst.trim()}${v_list[j].trim()}`;
        }
        judege_list.push(_sst);
        last_index = i + 1;
      } else if (single_symbol.indexOf(_item) == -1 && _item.trim() != '') {
        judege_list.push(_item);
      } else if (_item == '*' && _item.trim() != '') {
        judege_list.push(_item);
      }
    }
    if (judege_list.length == 0) {
      judege_list = v_list;
    }
    // console.log(v_list);
    // console.log(judege_list);
    // console.log('------------');
    let is_vul = false;
    switch (judege_list.length) {
      case 1:
        is_vul = singleJudge(pkVersion, judege_list[0]);
        break;
      case 2:
        is_vul = singleJudge(pkVersion, judege_list[0]) && singleJudge(pkVersion, judege_list[1]);
        break;
      default:
        console.log('Impossible array length.', judege_list);
        break;
    }
    if (is_vul) {
      final_is_vul = is_vul;
      break;
    }
  }
  return final_is_vul;
}

function singleJudge(pkVersion, _v) {
  let is_vul = false;
  if (_v == '*') {
    is_vul = true;
  } else if (_v.indexOf('~') == 0) {
    if (pkVersion.indexOf(_v.substring(1)) == 0) {
      is_vul = true;
    }
  } else if (_v.indexOf('<=') == 0) {
    if (pkVersion <= _v.substring(2)) {
      is_vul = true;
    }
  } else if (_v.indexOf('<') == 0) {
    if (pkVersion < _v.substring(1)) {
      is_vul = true;
    }
  } else if (_v.indexOf('>=') == 0) {
    if (pkVersion >= _v.substring(2)) {
      is_vul = true;
    }
  } else if (_v.indexOf('>') == 0) {
    if (pkVersion > _v.substring(1)) {
      is_vul = true;
    }
  }
  return is_vul;
}

module.exports = { isVulJudge }

// const vulnerable_version = '>=0.2.1 <1.0.0 || >=1.2.3';
// console.log(innerJudge('0.0.8', vulnerable_version));