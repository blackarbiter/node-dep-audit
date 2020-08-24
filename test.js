'use strict';

const { api } = require('./index');

const pk = '/path/to/package.json';
const lockPk = '/path/to/package-lock.json';
api(pk, lockPk).then(r => {
  console.log(r);
});
