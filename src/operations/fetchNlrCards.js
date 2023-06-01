const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const innerText = require('@creately/inner-text');
const { cpMap } = require('../../src/utils');
const shelljs = require('shelljs');
const request = require('request');
const ID_FIELD = 'instance';
const PUBLICATIONS_LIST_PATH = path.join(__dirname, 'heritage__instance-to-item.tsv');
const FORMATS = ['037'];
const rows = fs.readFileSync(PUBLICATIONS_LIST_PATH, 'utf-8').split('\n').filter(
  (r) => !!r.trim(),
).map(
  (rowStr) => rowStr.split('\t'),
);
const idPos = rows[0].indexOf(ID_FIELD);
const getHtmlNodeText = (el) => (
  el
    ? (innerText(el, {
      tags: {
        a: ' ',
      },
    }) || '').trim()
    : ''
);

const run = async (ids) => {
  process.stdout.write(`ids to fetch: ${ids.length}\n`);
  shelljs.mkdir('-p', path.join(__dirname, 'cards'));
  await cpMap(
    FORMATS,
    async (format) => cpMap(
      ids,
      async (idx, serialId) => {
        const cardHtmlPath = path.join(__dirname, 'cards', `${idx}.${format}.html`);
        const cardtxtPath = path.join(__dirname, 'cards', `${idx}.${format}.txt`);
        const uri = `https://webservices.nlr.ru/util/?method=recordFormat&vid=07NLR_VU1&base=NLR01&sysid=${idx}&format=${format}`;
        process.stdout.write(`${serialId + 1} / ${ids.length} ${uri} -> ${cardHtmlPath} ... `);
        if (!fs.existsSync(cardtxtPath)) {
          const html = await (
            new Promise(
              (resolve, reject) => {
                request('GET', uri).set(
                  {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.87 Safari/537.36',
                  },
                ).end(
                  (err, res) => {
                    if (err) {
                      process.stderr.write(`ERROR: ${err}`);
                      reject(err);
                    } else if (res.ok) {
                      process.stdout.write(` got html (${res.text.length} symbols)`);
                      fs.writeFileSync(cardHtmlPath, res.text, 'utf-8');
                      resolve(res.text);
                    }
                  },
                );
              },
            )
          );
          const dom = new jsdom.JSDOM(html);
          const rows = [];
          dom.window.document.body.querySelectorAll('table tr').forEach(
            (el) => {
              const acc = [];
              el.querySelectorAll('td').forEach(
                (cellEl) => acc.push(getHtmlNodeText(cellEl)),
              );
              const tableStr = acc.join('\t');
              if (tableStr && (!tableStr.startsWith('Формат просмотра'))) {
                rows.push(tableStr);
              }
            },
          );
          const isDataOK = rows.length > 0;
          process[isDataOK ? 'stdout' : 'stderr'].write(` table (${rows.length} rows) saved to ${cardtxtPath}\n`);
          const tableText = rows.join('\n');
          if (isDataOK) {
            fs.writeFileSync(cardtxtPath, tableText, 'utf-8');
          }
          return tableText;
        } else {
          const tableText = fs.readFileSync(cardtxtPath, 'utf-8');
          process.stdout.write(` table (${tableText.split('\n').length} rows) loaded from ${cardtxtPath}\n`);
          return tableText;
        }
      },
    ),
  );
};

run(
  rows.slice(1).reduce(
    (acc, cells) => {
      const [org, id] = cells[idPos].replace(/^\(/u, '').split(')');

      if (org.toLowerCase() === 'RuSpRNB'.toLowerCase()) {
        return [...acc, id];
      }
      return acc;
    },
    [],
  ),
).catch(
  (err) => {
    console.error(err);
    process.exit(1);
  },
).then(
  (res) => {
    console.info(res);
    process.exit(0);
  },
);
