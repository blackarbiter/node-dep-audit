
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
      if ((_item != '*') && (!single_symbol.includes(_item.substring(0, 2))) && 
                            (!single_symbol.includes(_item.substring(0, 1))) &&
                            (_item.trim() != '')) {
        let _sst = '';
        for (let j=last_index; j<=i; j++) {
          _sst = `${_sst.trim()}${v_list[j].trim()}`;
        }
        judege_list.push(_sst);
        last_index = i + 1;
      } else if (!single_symbol.includes(_item) && _item.trim() != '') {
        judege_list.push(_item);
        last_index = i + 1;
      } else if (_item == '*' && _item.trim() != '') {
        judege_list.push(_item);
        last_index = i + 1;
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
    if (pkVersion == _v.substring(1)) {
      is_vul = true;
    }
  } else if (_v.indexOf('<=') == 0) {
    if (versionNumJudge(pkVersion,  _v.substring(2), '<=')) {
      is_vul = true;
    }
  } else if (_v.indexOf('<') == 0) {
    if (versionNumJudge(pkVersion,  _v.substring(1), '<')) {
      is_vul = true;
    }
  } else if (_v.indexOf('>=') == 0) {
    if (versionNumJudge(pkVersion,  _v.substring(2), '>=')) {
      is_vul = true;
    }
  } else if (_v.indexOf('>') == 0) {
    if (versionNumJudge(pkVersion,  _v.substring(1), '>')) {
      is_vul = true;
    }
  } else {
    if (pkVersion == _v) {
      is_vul = true;
    }
  }
  return is_vul;
}

function versionNumJudge(pkVersion, vulVersion, operate) {
  let newVulVersion = vulVersion;
  if (vulVersion.indexOf('v') == 0) {
    newVulVersion = vulVersion.substring(1);
  }
  try {
    const pkVersionList = versionStr2NumObj(pkVersion);
    const vulVersionList = versionStr2NumObj(newVulVersion);
    let longLength = 0;
    if (pkVersionList.length == vulVersionList.length) {
      longLength = pkVersionList.length;
    } else if (pkVersionList.length > vulVersionList.length) {
      longLength = pkVersionList.length;
      for (let i=vulVersionList.length; i<longLength; i++) {
        vulVersionList.push({
          key: '0',
          isPurNum: true
        });
      }
    } else {
      longLength = vulVersionList.length;
      for (let i=pkVersionList.length; i<longLength; i++) {
        pkVersionList.push({
          key: '0',
          isPurNum: true
        });
      }
    }
    
    let isVul = true;
    for (let i=0; i<longLength; i++) {
      const _rj = itemNumJudge(pkVersionList[i], vulVersionList[i], operate);
      const _jIsVul = _rj['isVul'];
      const _jIsSame = _rj['isSame'];
      if (i == longLength-1) {
        if (!_jIsVul) {
          isVul = false;
          break;
        }
      } else {
        if (!_jIsSame && _jIsVul) {
          break;
        }
        if (!_jIsSame && !_jIsVul) {
          isVul = false;
          break;
        }
      }
    }
    return isVul;
  } catch (err) {
    console.log(`danger.js => versionNumJudge, error: ${err}`);
  }
  return false;
}

function itemNumJudge(pkItem, vulItem, operate) {
  let isVul = false;
  const pkItemKey = pkItem['key'];
  const pkIsPurNum = pkItem['isPurNum'];
  const vulItemKey = vulItem['key'];
  const vulIsPurNum = vulItem['isPurNum'];
  switch(operate) {
    case '<=':
      if (pkIsPurNum && vulIsPurNum) {
        if (parseInt(pkItemKey) <= parseInt(vulItemKey)) {
          isVul = true;
        }
      } else {
        if (pkItemKey <= vulItemKey) {
          isVul = true;
        }
      }
      break;
    case '<':
      if (pkIsPurNum && vulIsPurNum) {
        if (parseInt(pkItemKey) < parseInt(vulItemKey)) {
          isVul = true;
        }
      } else {
        if (pkItemKey < vulItemKey) {
          isVul = true;
        }
      }
      break;
    case '>=':
      if (pkIsPurNum && vulIsPurNum) {
        if (parseInt(pkItemKey) >= parseInt(vulItemKey)) {
          isVul = true;
        }
      } else {
        if (pkItemKey >= vulItemKey) {
          isVul = true;
        }
      }
      break;
    case '>':
      if (pkIsPurNum && vulIsPurNum) {
        if (parseInt(pkItemKey) > parseInt(vulItemKey)) {
          isVul = true;
        }
      } else {
        if (pkItemKey > vulItemKey) {
          isVul = true;
        }
      }
      break;
    default:
      break;
  }
  return {
    'isVul': isVul,
    'isSame': pkItemKey == vulItemKey
  };
}

function versionStr2NumObj(strVersion) {
  const num_list = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const _r = [];
  strVersion.split('.').map((key) => {
    let isPurNum = true;
    for (const ch of key) {
      if (!num_list.includes(ch)) {
        isPurNum = false;
        break;
      }
    }
    _r.push({
      'key': key,
      'isPurNum': isPurNum
    });
  });
  return _r;
}

module.exports = { isVulJudge }

// const vulnerable_version = '<3.35.1 || >=4.0.0 <4.44.3 || >=5.0.0 <5.8.11';
// console.log(innerJudge('5.1.3', vulnerable_version));