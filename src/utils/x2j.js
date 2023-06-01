const { js2xml, xml2js } = require('xml-js');

const x2j = (input, options) => {
  if ((typeof input !== 'string') && (!Buffer.isBuffer(input))) {
    return input;
  }
  const result = xml2js(input, options);
  const cleanParentRec = (node) => {
    if (node) {
      if (node.parent) {
        node.parent = undefined;
      }
      if (node._parent) {
        node._parent = undefined;
      }
      if (Array.isArray(node)) {
        node.forEach(cleanParentRec);
      } else if (Array.isArray(node.elements)) {
        node.elements.forEach(cleanParentRec);
      } else if (typeof node === 'object') {
        Object.keys(node).forEach(k => cleanParentRec(node[k]));
      }
    }
    return node;
  };
  return cleanParentRec(result);
};

const j2x = (input, options) => {
  if (typeof input !== 'object') {
    return input;
  }
  return js2xml(input, options);
};

module.exports = {
  x2j,
  j2x,
};
