const { getCode, parseJson } = require('../utils/json');
const { DenpendencyTree, DenpendencyNode } = require('./dep-node');
const { isVulJudge } = require('../utils/danger');

const regExp = /dependencies|devDependencies|requires/;
const versionTag = 'version';

class Dependency {
  
  
  /**
   * Enter point method.
   * @param {object} results Store analysis result.
   * @param {string} packageFilePath File path of package.json.
   * @param {string} lockPackageFilePath File path of package-lock.json.
   */
  startAnalysis(results, packageFilePath, lockPackageFilePath, dependencyDeep) {
    console.log(`Start get base dependencies by package.json. File path: ${packageFilePath}`);
    this.getBaseDependencies(results, packageFilePath);
    const _t1 = process.uptime();
    console.log(`End. Consume time: ${_t1}s.`);
    console.log(`Start construct dependency tree by package-lock.json. Lock file path: ${lockPackageFilePath}`);
    console.log(`Max dependency deep is ${dependencyDeep}`);
    this.getDependencyTree(results, lockPackageFilePath, dependencyDeep);
    const _t2 = process.uptime();
    console.log(`End. Consume time: ${_t2 - _t1}s.`);
    console.log(`Start generate dependency lists.`);
    this.deConstructDenpendencyTree(results);
    const _t3 = process.uptime();
    console.log(`End. Generate ${results['dependencyLists'].length} dependency list. Consume time ${_t3 - _t2}s`);
  }

  deConstructDenpendencyTree(results) {
    const dependency_lists = [];
    const denpendencyTree = results['denpendencyTree'];
    denpendencyTree.traverseDF(node => {
      if (node.vulIndex > -1) {
        let _list = [];
        while(node.parent) {
          _list.push(node);
          node = node.parent;
        }
        dependency_lists.push(_list);
      }
    });
    results['dependencyLists'] = dependency_lists;
  }

  /**
   * Get dev?(d|D)ependencies items, and store in results.
   * @param {object} results Store analysis result.
   * @param {*} packageFilePath File path of package.json.
   */
  getBaseDependencies(results, packageFilePath) {
    if (results == null) {
      results = {};
    }
    results['dependencies'] = {};
    results['devDependencies'] = {};
    const code = getCode(packageFilePath);
    if (code.length == 0) {
      return;
    }
    const json_data = parseJson(code);
    for (const _k in json_data) {
      if (regExp.test(_k)) {
        const _v = json_data[_k];
        for (const _dp in _v) {
          const _dp_v = _v[_dp];
          const _type = typeof _dp_v;
          if (_type == 'string') {
            results[_k][_dp] = _dp_v;
            if (_dp_v.indexOf('^') == 0) {
              results[_k][_dp] = _dp_v.substring(1);
            }
          } else {
            // object
            try {
              let _version = null;
              for (const _i_v in _dp_v) {
                if (_i_v == versionTag) {
                  _version = _dp_v[_i_v];
                  break;
                }
              }
              if (_version != null) {
                if (_version.indexOf('^') == 0) {
                  results[_k][_dp] = _version.substring(1);
                }
                results[_k][_dp] = _version;
              }
            } catch (error) {
              console.log('Get version error.', error);
              continue;
            }
          }
        }
      }
    }
  }

  getDependencyTree(results, lockPackageFilePath, dependencyDeep) {
    if (results == null) {
      return;
    }
    const denpendencyTree = new DenpendencyTree('root', '1.0.0');
    const nodeIdentify = denpendencyTree._root.identify;
    // dependencies && devDependencies
    const dependencies = results['dependencies'];
    const devDependencies = results['devDependencies'];
    const secAdvisories = results['secAdvisories'];
    if (dependencies == null || devDependencies == null || secAdvisories == null) {
      console.log('Neither of dependencies, devDependencies, secAdvisories can be null in results.');
      return;
    }
  
    const code = getCode(lockPackageFilePath);
    if (code.length == 0) {
      return;
    }
    let json_data = {};
    const lock_data = parseJson(code);
    if (lock_data.hasOwnProperty('dependencies')) {
      json_data = lock_data['dependencies'];
    }
    for (const _pkName in dependencies) {
      const _pkVersion = dependencies[_pkName];
      const vulIndex = isVulJudge(_pkName, _pkVersion, secAdvisories);
      let _identify, _deep;
      [_identify, _deep] = denpendencyTree.add(_pkName, _pkVersion, vulIndex, false, 
                            nodeIdentify, denpendencyTree.traverseDF);
      if (json_data.hasOwnProperty(_pkName) && dependencyDeep > 1) {
        this.recurConstructDepTree(json_data, _pkName, denpendencyTree, _identify, secAdvisories, 
                                    this.recurConstructDepTree, dependencyDeep);
      }
    }

    for (const _pkName in devDependencies) {
      const _pkVersion = devDependencies[_pkName];
      const vulIndex = isVulJudge(_pkName, _pkVersion, secAdvisories);
      let _identify, _deep;
      [_identify, _deep] = denpendencyTree.add(_pkName, _pkVersion, vulIndex, true, 
                            nodeIdentify, denpendencyTree.traverseDF);
      if (json_data.hasOwnProperty(_pkName) && dependencyDeep > 1) {
        this.recurConstructDepTree(json_data, _pkName, denpendencyTree, _identify, secAdvisories, 
                                    this.recurConstructDepTree, dependencyDeep);
      }
    }
    results['denpendencyTree'] = denpendencyTree;
  }

  recurConstructDepTree(lockJsonData, packageName, denpendencyTree, identify, secAdvisories, recurConstructDepTree, dependencyDeep) {
    const package_data = lockJsonData[packageName];
    // console.log(packageName);
    let isDev = false;
    if ((package_data.hasOwnProperty('dev')) && package_data['dev']) {
      isDev = true;
    }
    for(const _k1 in package_data) {
      if (regExp.test(_k1)) {
        const _data1 = package_data[_k1];
        // packageName
        for (const _k2 in _data1) {
          const _data2 = _data1[_k2];
          const _type2 = typeof _data2;
          let _version2;
          if (_type2 == 'string') {
            _version2 = _data2;
          } else if (_type2 == 'object') {
            _version2 = _data2[versionTag];
          }
          if (_version2.indexOf('^') == 0) {
            _version2 = _version2.substring(1);
          }
          const vulIndex = isVulJudge(_k2, _version2, secAdvisories);
          let _identify, _deep;
          [_identify, _deep] = denpendencyTree.add(_k2, _version2, vulIndex, isDev, 
                                identify, denpendencyTree.traverseDF);
          if (lockJsonData.hasOwnProperty(_k2) && _deep <= dependencyDeep - 1) {
            recurConstructDepTree(lockJsonData, _k2, denpendencyTree, _identify, secAdvisories, recurConstructDepTree, dependencyDeep);
          }
        }
      }
    }
  }
}

module.exports = { Dependency }
