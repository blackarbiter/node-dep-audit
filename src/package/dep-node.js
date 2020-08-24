const { getMd5 } = require('../utils/crypto');

function DenpendencyNode(name, version, vulIndex=-1, isDev=false) {
  this.identify = getMd5(Math.random().toString());
  this.deep = 0;
  this.name = name;
  this.version = version;
  this.vulIndex = vulIndex;
  this.isDev = isDev;
  this.parent = null;
  this.children = [];
}

function DenpendencyTree(name, version) {
  let denpendencyNode = new DenpendencyNode(name, version);
  this._root = denpendencyNode;
}

DenpendencyTree.prototype.traverseDF = function (callback) {
  (function recurse(currentNode) {
    for (let i = 0, { length } = currentNode.children; i < length; i++) {
      recurse(currentNode.children[i]);
    }
    callback(currentNode);
  })(this._root);
};

DenpendencyTree.prototype.contains = function (callback, traversal) {
  traversal.call(this, callback);
};

DenpendencyTree.prototype.add = function (name, version, vulIndex, isDev, toIdentify, traversal) {
  let child = new DenpendencyNode(name, version, vulIndex, isDev);
  let parent = null;
  let callback = function (node) {
    if (node.identify === toIdentify) {
      parent = node;
    }
  };
  this.contains(callback, traversal);
  if (parent) {
    parent.children.push(child);
    child.parent = parent;
    child.deep = parent.deep + 1;
  } else {
    throw new Error('Cannot add node to a non-existent parent.');
  }
  return [child.identify, child.deep];
};

module.exports = { DenpendencyTree, DenpendencyNode };