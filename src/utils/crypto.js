const crypto = require('crypto');

/**
 * 获取相关数据的md5值
 * @param { string } data 
 */
function getMd5(data) {
    return crypto.createHash('md5').update(data, 'utf-8').digest('hex');
  }

module.exports = { getMd5 }