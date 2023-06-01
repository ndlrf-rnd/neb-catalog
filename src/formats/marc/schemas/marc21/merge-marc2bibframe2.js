const { js2xml } = require('xml-js');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { x2j } = require('../../../../utils/x2j');

const BF2_VANILLA_XSLT_NAME = path.join(__dirname, '..', 'contrib', 'marc2bibframe2', 'xsl', 'marc2bibframe2.xsl');
const BF2_XSLT_NAME = path.join(__dirname, './marc2bibframe2.merged.xsl');

const forceArray = (x) => (Array.isArray(x) ? x : [x].filter((v) => !!v));

const mergeXslIncludes = (rootStylesheetPath, outputStylesheetPath) => {
  process.stderr.write(`Bundling XSL schema with root: ${rootStylesheetPath} -> ${outputStylesheetPath}\n`);
  // The complete inlines.xsl stylesheet didn't get inserted; its contents did. In other words,
  // everything between its xsl:stylesheet tags (the stylesheet's "emphasis" and "literal"
  // template rules) got inserted where the makehtml.xsl stylesheet had its xsl:include instruction.
  const findIncludes = (xmlPath, startNode) => {
    let node;
    if (startNode) {
      node = startNode;
    }
    if (!startNode) {
      const p = path.resolve(xmlPath);
      node = x2j(fs.readFileSync(p, 'utf-8'), { compact: false });
    }
    let newInclude;
    if (node.name && node.name.toLowerCase().endsWith('include') && node.attributes && node.attributes.href) {
      const pathToInclude = path.join(path.dirname(xmlPath), node.attributes.href);
      process.stderr.write(`Including ${pathToInclude}\n`);
      newInclude = findIncludes(pathToInclude);
    }
    if (newInclude) {
      return newInclude.elements.reduce((a, el) => ([...a, ...(el.elements || [])]), []);
    }
    return {
      ...node,
      elements: (node.elements || []).reduce(
        (a, o) => ([
          ...a,
          ...forceArray(findIncludes(xmlPath, o)),
        ]),
        [],
      ),
    };
  };
  const result = js2xml(
    findIncludes(rootStylesheetPath),
    {
      compact: false,
      spaces: 2,
    },
  ).trim();
  if (outputStylesheetPath) {
    fs.writeFileSync(outputStylesheetPath, result, 'utf-8');
    return outputStylesheetPath;
  }
  return result;
};
mergeXslIncludes(BF2_VANILLA_XSLT_NAME, BF2_XSLT_NAME);
