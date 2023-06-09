/*
The MIT License (MIT)

Copyright (c) 2014, 2016, 2017 Simon Lydell
Copyright (c) 2017 Randall Randall
Copyright (c) 2019 Aito Intelligence Oy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
const isObject = obj => typeof obj === 'object' && obj !== null;

let forEach = (obj, cb) => {
  if (Array.isArray(obj)) {
    obj.forEach(cb)
  } else if (isObject(obj)) {
    Object.keys(obj).forEach(function (key) {
      var val = obj[key]
      cb(val, key)
    })
  }
};

const getTreeDepth = obj => {
  var depth = 0

  if (Array.isArray(obj) || isObject(obj)) {
    forEach(obj, function (val) {
      if (Array.isArray(val) || isObject(val)) {
        var tmpDepth = getTreeDepth(val)
        if (tmpDepth > depth) {
          depth = tmpDepth
        }
      }
    })

    return depth + 1
  }

  return depth
};

export const stringify = (obj, options) => {
  options = options || {}
  var indent = JSON.stringify([1], null, get(options, 'indent', 2)).slice(2, -3)
  var addMargin = get(options, 'margins', false)
  var addArrayMargin = get(options, 'arrayMargins', false)
  var addObjectMargin = get(options, 'objectMargins', false)
  var maxLength = (indent === '' ? Infinity : get(options, 'maxLength', 80))
  var maxNesting = get(options, 'maxNesting', Infinity)

  return (function _stringify (obj, currentIndent, reserved) {
    if (obj && typeof obj.toJSON === 'function') {
      obj = obj.toJSON()
    }

    var string = JSON.stringify(obj)

    if (string === undefined) {
      return string
    }

    var length = maxLength - currentIndent.length - reserved

    var treeDepth = getTreeDepth(obj)
    if (treeDepth <= maxNesting && string.length <= length) {
      var prettified = prettify(string, {
        addMargin: addMargin,
        addArrayMargin: addArrayMargin,
        addObjectMargin: addObjectMargin
      })
      if (prettified.length <= length) {
        return prettified
      }
    }

    if (isObject(obj)) {
      var nextIndent = currentIndent + indent
      var items = []
      var delimiters
      var comma = function (array, index) {
        return (index === array.length - 1 ? 0 : 1)
      }

      if (Array.isArray(obj)) {
        for (var index = 0; index < obj.length; index++) {
          items.push(
            _stringify(obj[index], nextIndent, comma(obj, index)) || 'null'
          )
        }
        delimiters = '[]'
      } else {
        Object.keys(obj).forEach(function (key, index, array) {
          var keyPart = JSON.stringify(key) + ': '
          var value = _stringify(obj[key], nextIndent,
            keyPart.length + comma(array, index))
          if (value !== undefined) {
            items.push(keyPart + value)
          }
        })
        delimiters = '{}'
      }

      if (items.length > 0) {
        return [
          delimiters[0],
          indent + items.join(',\n' + nextIndent),
          delimiters[1]
        ].join('\n' + currentIndent)
      }
    }

    return string
  }(obj, '', 0))
};

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,\][}{]/g

function prettify (string, options) {
  options = options || {}

  var tokens = {
    '{': '{',
    '}': '}',
    '[': '[',
    ']': ']',
    ',': ', ',
    ':': ': '
  }

  if (options.addMargin || options.addObjectMargin) {
    tokens['{'] = '{ '
    tokens['}'] = ' }'
  }

  if (options.addMargin || options.addArrayMargin) {
    tokens['['] = '[ '
    tokens[']'] = ' ]'
  }

  return string.replace(stringOrChar, function (match, string) {
    return string ? match : tokens[match]
  })
}

function get (options, name, defaultValue) {
  return (name in options ? options[name] : defaultValue)
}

export default stringify;