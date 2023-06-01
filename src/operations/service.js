const shellJs = require('shelljs');

const service = async (config, onProgress) => {
  if (`${config.command || ''}`.trim().length === 0) {
    return {
      output: null,
      error: `No 'command' parameter provided`,
      code: -1
    };
  }
  const { stdout, stderr, code } = await shellJs.exec(config.command, { silent: true });
  return {
    output: stdout,
    error: stderr,
    code,
  };
};

module.exports = {
  service,
};
