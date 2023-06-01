import uniq from '../contrib/lodash-es/uniq.js';
import flattenDeep from '../contrib/lodash-es/flattenDeep.js';

export const URL_TEMPLATE_OPERATORS = ['+', '#', '.', '/', ';', '?', '&'];
/**
 * Source: Copyright (c) 2012-2014, Bram Stein All rights reserved.
 * License: https://github.com/bramstein/url-template/blob/master/LICENSE
 * @param templateStr
 * @returns {*}
 */
export const parseTemplateStr = (templateStr) => {
  let variables = {};
  templateStr.replace(
    /\{([^\{\}]+)\}|([^\{\}]+)/g,
    function (_, expression, literal) {
      if (expression) {
        const operator = expression[0];
        if (URL_TEMPLATE_OPERATORS.indexOf(expression.charAt(0)) !== -1) {
          expression = expression.substr(1);
        }
        expression.split(/,/g).forEach(function (variable) {
          const tmp = variable.match(/([^:\*]*)(?::(\d+)|(\*))?/uig);
          variables[operator] = variables[operator] || [];
          variables[operator] = uniq(variables[operator].concat(flattenDeep(tmp)).filter(v => !!v));
        });
      }
    },
  );
  return variables;
};
