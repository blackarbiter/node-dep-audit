# 1.问题
npm audit命令可以帮助检测项目的依赖包是否存在已知的漏洞，漏洞库来源：[Security advisories](https://www.npmjs.com/advisories) 。 当希望将依赖组件漏洞纳入SAST漏洞扫描范围是，通常的想法是通过执行npm audit命令以获取相关的结果。
```
const run = () =>{
  const auditCommand = 'npm audit --registry=https://r.cnpmjs.org/ --audit-level=high --production --json';
  const execOptions = { maxBuffer: 10 * 1024 * 1024 };

  exec(auditCommand, execOptions, function (error, stdout, stderr) {
      if (error !== null) {
      console.log('exec error: ' + error);
        return;
      }

      if (stdout) {
        console.log(stdout);
      }
  });
}
```
但是执行的时候往往或出现下面的错误。
```
exec error: Error: Command failed: npm audit --registry=https://r.cnpmjs.org/ --audit-level=high --production --json
```
而且使用npm audit不能控制依赖的深度，返回的结果为所有深度的依赖项目。

# 2.解决
为了解决上面的难题，决定自己实现一套npm audit，并且可以自有的控制依赖的深度。为此采用树结构对package-lock.json进行建模，树的深度为依赖深度+1，因为根节点为空。

# 3.使用
```
npm install -g node-dep-audit
```
```
node-dep-audit --help
选项：
  --version                显示版本号                                     [布尔]
  --pk, --package          File path of package.json.            [字符串] [必需]
  --lockPk, --lockPackage  File path of package-lock.json.       [字符串] [必需]
  -d, --deep               Recursion depth for find dependency list.
                                                              [数字] [默认值: 3]
  -o, --output             File to store results, type must be .json.   [字符串]
  --help                   显示帮助信息                                   [布尔]
```
运行
```
./bin/node-dep-audit --pk /path/to/package.json --lockPk /path/to/package-lock.json
```
***
## English
***
# 1.Problem
The npm audit command can help detect whether there are known vulnerabilities in the dependent packages of the project. The source of the vulnerability library: [Security advisories](https://www.npmjs.com/advisories). When you want to include the vulnerabilities of dependent components into the scope of SAST vulnerability scanning, the usual idea is to obtain relevant results by executing the npm audit command.
```
const run = () =>{
  const auditCommand = 'npm audit --registry=https://r.cnpmjs.org/ --audit-level=high --production --json';
  const execOptions = { maxBuffer: 10 * 1024 * 1024 };

  exec(auditCommand, execOptions, function (error, stdout, stderr) {
      if (error !== null) {
      console.log('exec error: ' + error);
        return;
      }

      if (stdout) {
        console.log(stdout);
      }
  });
}
```
However, the following errors often occur during execution.
```
exec error: Error: Command failed: npm audit --registry=https://r.cnpmjs.org/ --audit-level=high --production --json
```
# 2.Solve the Problem
In order to solve the above problems, I decided to implement 'npm audit' by myself, and can control the depth of dependence on my own. To do this, a tree structure is used to model package-lock.json. The depth of the tree is dependent depth +1 because the root node is empty.

# 3.Usage
```
npm install -g node-dep-audit
```
```
node-dep-audit --help
选项：
  --version                显示版本号                                     [布尔]
  --pk, --package          File path of package.json.            [字符串] [必需]
  --lockPk, --lockPackage  File path of package-lock.json.       [字符串] [必需]
  -d, --deep               Recursion depth for find dependency list.
                                                              [数字] [默认值: 3]
  -o, --output             File to store results, type must be .json.   [字符串]
  --help                   显示帮助信息                                   [布尔]
```
Run.
```
./bin/node-dep-audit --pk /path/to/package.json --lockPk /path/to/package-lock.json
```
***
# 运行示例
```
Start pull security advisories.
Data pull progress: 6.997%
Data pull progress: 13.99%
Data pull progress: 20.99%
Data pull progress: 27.99%
Data pull progress: 34.98%
Data pull progress: 41.98%
Data pull progress: 48.98%
Data pull progress: 55.98%
Data pull progress: 62.98%
Data pull progress: 69.97%
Data pull progress: 76.97%
Data pull progress: 83.97%
Data pull progress: 90.97%
Data pull progress: 97.97%
Data pull progress: 100%
End. Security advisories size 1429. Consume time: 18.734s.
Start get base dependencies by package.json. File path: /path/to/package.json
End. Consume time: 18.879s.
Start construct dependency tree by package-lock.json. Lock file path: /path/to/package-lock.json
Max dependency deep is 3
End. Consume time: 0.9029999999999987s.
Start generate dependency lists.
End. Generate 223 dependency list. Consume time 0s

        ---------------------------------------------------------
        Result Size      : 223
        ---------------------------------------------------------

        ---------------------------------------------------------
        Severity         : low
        Package          : minimist
        Version          : 0.0.8
        VulnerableVersion: <0.2.1 || >=1.0.0 <1.2.3
        PatchedVsersion  : >=0.2.1 <1.0.0 || >=1.2.3
        DependencyPath   : mkdirp > minimist
        Dev              : false
        MoreInfo         : https://www.npmjs.com/advisories/1179
        ---------------------------------------------------------
.......
```