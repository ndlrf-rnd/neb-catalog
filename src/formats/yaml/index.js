const yaml = require('js-yaml');
const YAML_MEDIA_TYPE = 'application/yaml';
const YAML_ENCODING = 'utf-8';
const YAML_LOAD_OPTIONS = {};
const YAML_DUMP_OPTIONS = {};
const YAML_EXTENSION = 'yaml';
module.exports = {
  encoding: YAML_ENCODING ,
  extension: YAML_EXTENSION,
  mediaType: YAML_MEDIA_TYPE,
  is: (input) => {
    if (typeof input === 'string') {
      try {
        jsyaml.safeLoad(input);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  },
  from: (input)=> yaml.safeDump(input, YAML_LOAD_OPTIONS),
  to:  (input) => yaml.safeLoad(input, YAML_DUMP_OPTIONS),
};