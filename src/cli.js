const argparse = require('argparse');
const { DEFAULT_JOBS, VERSION } = require('./constants');

const parseArgs = (args) => {
  const parser = new argparse.ArgumentParser({
    // version: VERSION,
    add_help: true,
    description: 'catalog',
  });
  parser.add_argument('-v', '--version', {
    action: 'version',
    version: VERSION,
  });
  parser.add_argument(
    '-j', '--jobs',
    {
      help: 'Parallel jobs',
      type: 'int',
      default: DEFAULT_JOBS,
    },
  );

  parser.add_argument(
    '-m', '--migrate',
    {
      help: 'Migrate main database',
      action: 'store_true',
    },
  );
  parser.add_argument(
    '-f', '--force',
    {
      help: 'Force migrate main database',
      action: 'store_true',
    },
  );
  parser.add_argument(
    '-C', '--reset-cache',
    {
      help: 'Reset feed cache',
      action: 'store_true',
    },
  );

  const subParsers = parser.add_subparsers({
    title: 'Command',
    dest: 'command',
  });

  const catalogParser = subParsers.add_parser(
    'catalog',
    {
      add_help: true,
      help: 'Run in catalog service mode',
    },
  );
  const workerParser = subParsers.add_parser(
    'worker',
    {
      add_help: true,
      help: 'Run in worker mode',
    },
  );
  const searchParser = subParsers.add_parser(
    'search',
    {
      add_help: true,
      help: 'Run in search service mode',
    },
  );

  return parser.parse_args(args);
};

module.exports = {
  parseArgs,
};
