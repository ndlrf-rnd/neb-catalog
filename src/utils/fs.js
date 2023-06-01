const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');

/**
 * @param {string} command process to run
 * @param {string[]} args commandline arguments
 * @returns {Promise<void>} promise
 */
const runCommand = (command, args = []) => new Promise((resolve, reject) => {
  const executedCommand = cp.spawn(command, args, {
    stdio: 'inherit',
    shell: true,
  });
  executedCommand.on('error',reject);
  executedCommand.on('exit', (code) => {
    if (code === 0) {
      resolve(code);
    } else {
      process.stderr.write(`Process exited with code: ${code}\n`);
      reject(code);
    }
  });
});

/**
 * Recursively remove directory like `rm -rf`
 * Taken from: https://stackoverflow.com/a/32197381
 * @param dirPath {string} - path to remove
 */
const rmrf = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    if (fs.statSync(dirPath).isDirectory()) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = `${dirPath}/${file}`;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          rmrf(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    } else {
      fs.unlinkSync(dirPath);
    }
  }
};


const mkdirpSync = (dir, recreate = false) => {
  if (!dir) {
    return null;
  }
  if (recreate && fs.existsSync(dir)) {
    rmrf(dir);
  }
  return shelljs.mkdir('-p', dir);
};

const shouldCreate = async (p, overwrite = true, silent = true) => new Promise(
  (resolve, reject) => {
    fs.exists(p, (result) => {
      if (result) {
        if (overwrite) {
          if (!silent) {
            process.stderr.write(`${p} will be replaced\n`);
          }
          rmrf(p);
          resolve(true);
        } else {
          if (!silent) {
            process.stderr.write(`${p} will be replaced\n`);
          }
          resolve(false);
        }
      } else {
        const dir = path.dirname(p);
        fs.exists(dir, (ex) => {
          if (!ex) {
            shelljs.mkdir('-p', dir);
          } else {
            resolve(true);
          }
        });
      }
    });
  },
);


const addFilenameSuffix = (fn, suffix = '') => fn.replace(
  /(\.[^.]*)$/u,
  `.${suffix.replace(/^[.]/u, '')}$1`
)


const isWindows = (opts = {}) => process.platform !== 'win32' || opts.windows === true;

/*!
 * LICENSE NOTE
 * is-invalid-path <https://github.com/jonschlinkert/is-invalid-path>
 *
 * Copyright (c) 2015-2018, Jon Schlinkert.
 * Released under the MIT License.
 */

// https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx#maxpath
const PATH_LENGTH = 260;
const EXTENDED_PATH_LENGTH = 32767;
const MAX_PATH_SAFE_ZONE = 12;
/**
 *
 * @param fp {string|Buffer}
 * @param options
 * @returns {boolean}
 */
const isInvalidPath = (fp, options = {}) => {
  if (fp === '' || typeof fp !== 'string') {
    return true;
  }
  if (!isWindows(options)) {
    return true;
  }
  const MAX_PATH = options.extended ? EXTENDED_PATH_LENGTH : PATH_LENGTH;
  // noinspection SuspiciousTypeOfGuard
  if ((typeof fp !== 'string') || (fp.length > (MAX_PATH - MAX_PATH_SAFE_ZONE))) {
    return true;
  }

  const rootPath = path.parse(fp).root;
  if (rootPath) {
    fp = fp.slice(rootPath.length);
  }

  // https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx#Naming_Conventions
  if (options.file) {
    return /[<>:"/\\|?*]/.test(fp);
  }
  return /[<>:"|?*]/.test(fp);
};

const isValidPath = (fp, options) => !isInvalidPath(fp, options);
module.exports = {
  addFilenameSuffix,
  rmrf,
  isValidPath,
  isInvalidPath,
  isWindows,
  shouldCreate,
  mkdirpSync,
  runCommand,
};
