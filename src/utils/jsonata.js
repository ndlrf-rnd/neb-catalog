const fs = require('fs');
const jsonata = require('jsonata');
const { error } = require('./../utils/log');
const { MAPPING_ERROR_CTX_LINES } = require('../constants');

const buildStack = (schema, e, output) => {
  const stack = (schema || '').split('\n').reduce(
    (a, o, lineIdx) => {
      a.lines.push(o);
      const newPos = a.position + (o.length + 1);
      if ((a.position <= e.position) && (e.position < newPos)) {
        a.lines.push(`${' '.repeat(e.position - a.position)}^ ERROR!`);
        a.line = lineIdx + 1;
        a.column = (e.position - a.position) + 1;
      }
      a.position = newPos;
      return a;
    },
    {
      lines: [],
      line: 1,
      column: 1,
      position: 0,
    },
  );
  const stackStr = stack.lines.slice(
    Math.max(stack.line - MAPPING_ERROR_CTX_LINES, 0),
    Math.min(stack.line + (MAPPING_ERROR_CTX_LINES + 1), stack.lines.length + 1),
  ).join('\n');
  const errObj = {
    error: {
      message: e.message,
      position: e.position,
      line: stack.line,
      column: stack.column,
      stack: stackStr,
      // input,
    },
  };
  if (output && (typeof output.write === 'function')) {
    error(JSON.stringify(errObj))
    output.write(`JSONATA Error: ${JSON.stringify(errObj)}\n`);
  }
  return errObj;
};

const jsonataRunner = (schema, output = process.stderr) => {
  let jsn;
  try {
    jsn = jsonata(schema);
  } catch (e) {
    const errObj = buildStack(schema, e, output);
    throw new Error(JSON.stringify(errObj));
  }
  return (input, output = process.stderr, safe = true) => {
    try {
      const evalResult = jsn.evaluate(input);
      if (safe) {
        return JSON.parse(JSON.stringify(evalResult));
      } else {
        return evalResult;
      }
    } catch (e) {
      return buildStack(schema, e, output);
    }
  };
};

global.REGISTRY_JSONATA = {};

const jsonataFileRunner = (filePath) => jsonataRunner(
  fs.readFileSync(filePath, 'utf-8'),
);

const registerJsonata = (filePath) => {
  global.REGISTRY_JSONATA[filePath] = jsonataFileRunner(filePath);
  return (input, ...args) => {
    return global.REGISTRY_JSONATA[filePath](input, ...args);
  };
};

module.exports = {
  jsonataRunner,
  jsonataFileRunner,
  registerJsonata,
};