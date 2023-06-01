/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * ISC License
 *
 * Modified work: Copyright (c) 2015, 2017 University Of Helsinki (The National Library Of Finland)
 * Original work: Copyright (c) 2015 Pasi Tuominen
 *
 * Permission to use, copy, modify, and/or distribute this software for
 * any purpose with or without fee is hereby granted, provided that the
 * above copyright notice and this permission notice appear in all
 * copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND ISC DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL ISC BE LIABLE FOR ANY
 * SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/
const sortBy = require('lodash.sortby');
const { isObject } = require('../../utils');
const { lengthInBytes } = require('./../../utils/text');
const { isControlFieldTag } = require('./fields');
const {
  MARC_DIRECTORY_INDEX_SIZE,
  MARC_LEADER_LENGTH,
  MARC_FTC_CHAR,
  MARC_RECORD_SEPARATION_CHAR,
  MARC_SD_CHAR,
  MARC_BLANK_CHAR,
} = require('./constants');

const { padLeft } = require('../../utils/humanize');

/**
 * Converts the byte array to a UTF-8 string.
 */
const toString = (input) => Buffer.isBuffer(input) ? input.toString('utf-8') : input;
// Was initially:
// const byteArrayToString = (byte_array) => byte_array.toString('utf-8');

/**
 * Returns the entire directory starting at position 24. Control character
 * '\x1E' marks the end of directory
 */
const parseDirectory = (data_str) => {
  let curr_char = '';
  let directory = '';
  let pos = MARC_LEADER_LENGTH;
  while (curr_char !== MARC_FTC_CHAR) {
    curr_char = data_str.charAt(pos);
    if (curr_char !== MARC_FTC_CHAR) directory += curr_char;
    pos += 1;
    if ((data_str.length === 0)||(data_str.length <13) && (data_str.replace(/[\u0000\r\n\t]+$/uig, '').length === 0)) {
      break;
    }
    if (pos > data_str.length) {
      throw new Error(`Invalid record: ${data_str} with length ${data_str.length}`);
    }
  }
  return directory;
};

/**
 * Returns an array of 12-character directory entries.
 */
const parseDirectoryEntries = (directory_str) => {
  const directory_entries = [];
  let pos = 0;
  let count = 0;
  while (directory_str.length - pos >= MARC_DIRECTORY_INDEX_SIZE) {
    directory_entries[count] = directory_str.substring(pos, pos + MARC_DIRECTORY_INDEX_SIZE);
    pos += MARC_DIRECTORY_INDEX_SIZE;
    count += 1;
  }
  return directory_entries;
};

/**
 * Removes leading zeros from a numeric data field.
 */
const trimNumericField = (input) => {
  while (input.length > 1 && input.charAt(0) === '0') {
    input = input.substring(1);
  }
  return input;
};

/**
 *
 * @param directory_entry
 * @returns {*|string}
 */
const dirFieldTag = (directory_entry) => directory_entry.substring(0, 3);

/**
 *
 * @param directory_entry
 * @returns {*|string}
 */
const dirFieldLength = (directory_entry) => directory_entry.substring(3, 7);

/**
 *
 * @param directory_entry
 * @returns {*|string}
 */
const dirStartingCharacterPosition = (directory_entry) => directory_entry.substring(7, MARC_DIRECTORY_INDEX_SIZE);

/**
 * Returns a UTF-8 substring
 * @param str
 * @param start_in_bytes
 * @param length_in_bytes
 */
const substrUTF8 = (str, start_in_bytes, length_in_bytes) => toString(
  str.slice(start_in_bytes, start_in_bytes + length_in_bytes),
);

// Converts the input UTF-8 string to a byte array.
const toBuffer = (input) => isObject(input) ? input : Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');

// Adds leading zeros to the specified numeric field
const addLeadingZeros = (num_field, length) => {
  while (num_field.toString().length < length) {
    num_field = `0${num_field.toString()}`;
  }

  return num_field;
};

const processDataElementOld = (str) => {
  const subfields = [];
  let code;
  let curr_element_str = '';

  str.split('').forEach((item, index, arr) => {
    // MARC_SD_CHAR begins a new subfield, '\x1E' ends all fields
    if (item === MARC_SD_CHAR || item.charAt(index) === MARC_FTC_CHAR || index === arr.length - 1) {
      if (curr_element_str !== '') {
        curr_element_str = (index === arr.length - 1)
          ? curr_element_str + item
          : curr_element_str;

        // Parse code attribute
        code = curr_element_str.charAt(0);
        curr_element_str = curr_element_str.substring(1);

        // Remove trailing control characters
        if (curr_element_str.charAt(curr_element_str.length - 1) === MARC_SD_CHAR || curr_element_str.charAt(curr_element_str.length - 1) === MARC_FTC_CHAR) {
          curr_element_str = curr_element_str.substring(0, curr_element_str.length - 1);
        }

        // Create a <subfield> element
        // datafield.subfields.push({
        subfields.push({
          code,
          value: curr_element_str,
        });
        curr_element_str = '';
      }
    } else {
      curr_element_str += item;
    }
  });
  return subfields;
};

const convertRecordFromISO2709 = (input) => {
  const recordStr = toString(input);
  // Parse directory section
  const directory = parseDirectory(recordStr);
  const directory_entries = parseDirectoryEntries(directory);

  // Locate start of data fields (First occurrence of '\x1E')
  const data_start_pos = recordStr.search(MARC_FTC_CHAR) + 1;
  const data_field_str = recordStr.substring(data_start_pos);
  const data_field_str_utf8 = toBuffer(data_field_str);
  const record = {
    leader: recordStr.substring(0, MARC_LEADER_LENGTH),
    controlfield: [],
    datafield: [],
  };

  const processDirectoryEntry = (entry) => {
    let field_element_str;
    let data_element_str;
    let datafield;
    const tag = dirFieldTag(entry);

    // NOTE: fieldLength is the number of UTF-8 bytes in a string
    // TODO: Dont trim?
    const field_length = trimNumericField(dirFieldLength(entry));
    const start_char_pos = trimNumericField(dirStartingCharacterPosition(entry));

    // Append control fields for tags 00X
    if (tag.startsWith('00')) {
      field_element_str = data_field_str.substring(
        start_char_pos,
        parseInt(start_char_pos, 10) + parseInt(field_length, 10) - 1,
      );
      record.controlfield.push({
        tag,
        value: field_element_str,
      });
    } else {
      // Otherwise append a data field
      data_element_str = substrUTF8(
        data_field_str_utf8,
        parseInt(start_char_pos, 10),
        parseInt(field_length, 10),
      );

      if (data_element_str[2] !== MARC_SD_CHAR) {
        data_element_str = data_field_str[start_char_pos - 1] + data_element_str;
      }

      // Parse indicators and convert MARC_SD_CHAR characters to spaces for valid XML output
      const indStr = data_element_str
        ? data_element_str.substr(0, 2).replace(/[^a-z0-9]/ig, MARC_BLANK_CHAR)
        : [MARC_BLANK_CHAR, MARC_BLANK_CHAR].join('');
      let ind1 = indStr.charAt(0);
      let ind2 = indStr.charAt(1);

      // Create a <datafield> element
      datafield = {
        tag,
        ...(
          (!isControlFieldTag(tag))
            ? {
              ind1: ind1 === MARC_SD_CHAR ? MARC_BLANK_CHAR : ind1,
              ind2: ind2 === MARC_SD_CHAR ? MARC_BLANK_CHAR : ind2,
              subfield: [],
            }
            : {}
        ),
      };

      // Parse all subfields
      data_element_str = data_element_str.substring(2);

      // Bypass indicators
      datafield.subfield = datafield.subfield.concat(processDataElementOld(data_element_str));
      record.datafield.push(datafield);
    }
  };
  // Loop through directory entries to read data fields
  directory_entries.forEach(processDirectoryEntry);
  return {
    ...record,
    controlfield: record.controlfield,//sortBy(record.controlfield, ({ tag }) => tag),
    datafield: record.datafield,//sortBy(record.datafield, ({ tag }) => tag),
  };
};

const splitRecords = (input, separator = MARC_RECORD_SEPARATION_CHAR) => {
  let offset = 0;
  const result = [];
  const recordBuffer = toBuffer(input);
  while (offset !== -1) {
    const id = recordBuffer.indexOf(separator, offset);
    if (id !== -1) {
      result.push(recordBuffer.slice(offset, id + 1));
      offset = id + 1;
    } else {
      break;
    }
  }
  if (offset < recordBuffer.byteLength) {
    result.push(recordBuffer.slice(offset));
  }
  return result;
};

const convertRecordToISO2709 = (recordObj) => {
  let record_str = '';
  let directory_str = '';
  let datafield_str = '';
  let leader = recordObj.leader;
  let char_pos = 0;

  const cf = recordObj.controlfield || (recordObj.getControlfields ? recordObj.getControlfields() : []);
  const df = recordObj.datafield || (recordObj.getDatafields ? recordObj.getDatafields() : []);

  cf.forEach((field) => {
    directory_str += field.tag;

    if ((typeof field.value === 'undefined') || (field.value.length === 0)) {
      // Special case: control field contents empty
      directory_str += addLeadingZeros(1, 4);
      directory_str += addLeadingZeros(char_pos, 5);
      char_pos += 1;
      datafield_str += MARC_FTC_CHAR;
    } else {
      directory_str += addLeadingZeros(field.value.length + 1, 4);

      // Add character position
      directory_str += addLeadingZeros(char_pos, 5);

      // Advance character position counter
      char_pos += lengthInBytes(field.value) + 1;
      datafield_str += (field.value + MARC_FTC_CHAR);
    }
  });

  df.forEach((field) => {
    let curr_datafield = '';
    const { tag, ind1, ind2 } = field;

    // Add tag to directory
    directory_str += tag;

    // Add indicators
    datafield_str += ((ind1 || MARC_BLANK_CHAR) + (ind2 || MARC_BLANK_CHAR) + MARC_SD_CHAR);
    const sf = (field.subfield || field.subfields);
    sf.forEach((subfield, index) => {
      let subfield_str = subfield.code + subfield.value;

      // Add separator for subfield or data field
      subfield_str += index === sf.length - 1 ? MARC_FTC_CHAR : MARC_SD_CHAR;
      curr_datafield += subfield_str;
    });

    datafield_str += curr_datafield;

    // Add length of field containing indicators and a separator (3 characters total)
    directory_str += addLeadingZeros(toBuffer(curr_datafield).length + 3, 4);

    // Add character position
    directory_str += addLeadingZeros(char_pos, 5);

    // Advance character position counter
    char_pos += lengthInBytes(curr_datafield) + 3;
  });

  // Recalculate and write new string length into leader
  const new_str_length = toBuffer(leader + directory_str + MARC_FTC_CHAR + datafield_str + MARC_RECORD_SEPARATION_CHAR).length;
  leader = padLeft(new_str_length, '0', 5) + leader.substring(5);

  // Recalculate base address position
  const new_base_addr_pos = MARC_LEADER_LENGTH + directory_str.length + 1;
  leader = leader.substring(0, MARC_DIRECTORY_INDEX_SIZE) + padLeft(new_base_addr_pos, '0', 5) + leader.substring(17);
  record_str += (leader + directory_str + MARC_FTC_CHAR + datafield_str + MARC_RECORD_SEPARATION_CHAR);
  return record_str;
};


// The last element will always be empty because records end in char 1D
// eslint-disable-next-line no-control-regex
const fromISO2709 = (record_data, config) => splitRecords(record_data).map(
  (rec) => {
    return convertRecordFromISO2709(rec);
  },
).reduce(
  (product, item) => (Array.isArray(product) ? product.concat(item) : [product, item]),
  [],
);

const toISO2709 = (record_data) => (
  Array.isArray(record_data)
    ? record_data.reduce((product, item) => product + convertRecordToISO2709(item), '')
    : convertRecordToISO2709(record_data)
);


module.exports = {
  splitRecords,
  fromISO2709,
  toISO2709,
  toString,
  toBuffer,
};
