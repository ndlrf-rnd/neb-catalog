const fs = require('fs');
const { rmrf, runCommand } = require('./fs');
const { prettyBytes } = require('./humanize');
const { log } = require('./log');

const pngCrush = async (cmd, src, target, removeSrc = true) => {
  const sizeBeforeBytes = fs.statSync(src).size;
  const pngcrushCmd = `${cmd} ${src} ${target}`;
  log(`Optimizing rendered png with PNGCRUSH utility ${src} -> ${target} using command:`);
  log(`$ ${pngcrushCmd}`);
  await runCommand(pngcrushCmd);
  const sizeAfterBytes = fs.statSync(target).size;
  log(
    'Render file size was reduced'
    + ` from ${sizeBeforeBytes} bytes (${prettyBytes(sizeBeforeBytes)})`
    + ` to ${sizeAfterBytes} bytes (${prettyBytes(sizeAfterBytes)})`
    + ` (${((sizeAfterBytes / sizeBeforeBytes) * 100).toFixed(2)}% of initial size)`,
  );
  if (removeSrc) {
    log(`Removing ${src}`);
    rmrf(src);
  }
  return target;
};

module.exports = {
  pngCrush,
};
