const ChildProcess = require('child_process');

/**
 * @returns {Promise<void>} promise
 * @param cmd
 */
const pExec = (cmd) => {
  return new Promise((resolve, reject) => {
    ChildProcess.exec(
      cmd,
      (error, stdout, stderr) => {
        if (stderr) {
          error(`STDERR: ${stderr}\n`);
        }
        if (error) {
          error(`ERROR: ${error.message}\n${error.stack}`);
          reject(error);
          return;
        }
        resolve(stdout);
      }
    );
  });
};
module.exports = {
  pExec
};
