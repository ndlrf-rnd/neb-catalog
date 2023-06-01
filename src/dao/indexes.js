
// const ensureGin = async () => {
//   const entities = Object.keys((await describeDbEntities()).entities).sort();
//   const q = entities.map((name) => GIN(ENTITY_NAME(name))).join('\n');
//   const db = await getDb();
//   return db.none(q);
// };

//https://stackoverflow.com/posts/25536748/revisions
//https://stackoverflow.com/questions/13998139/optimize-postgres-timestamp-query-range/14007963#14007963
const TIME_SYS_IDX = (table, extraColumns = []) => `
  CREATE INDEX IF NOT EXISTS
    ${table}__time_sys__idx_btree
    ON ${table}
    USING btree (
      time_sys DESC NULLS LAST 
      ${extraColumns ? extraColumns.map(c => `, ${c}`).join('') : []}
    )
;`;
const TIME_SOURCE_IDX = (table, extraColumns = []) => `
  CREATE INDEX IF NOT EXISTS
    ${table}__time_source__idx_btree
    ON ${table}
    USING btree (
      time_source DESC NULLS LAST 
      ${extraColumns ? extraColumns.map(c => `, ${c}`).join('') : []}
    )
;`;
//
// const TIME_VALID_IDX = (table, extraColumns = []) => `
// CREATE INDEX IF NOT EXISTS
//   ${table}__upper__time_valid__idx_btree
//   ON ${table}
//   USING btree (
//     time_valid DESC NULLS LAST ${extraColumns ? extraColumns.map(c => `, ${c}`).join('') : []}
//   )
// ;`;

const TSRANGE_GIST = (table) => `
  CREATE INDEX IF NOT EXISTS
  ${table}__time_sys__idx_пшые
  ON ${table}
  USING GiST (time_sys);`;

module.exports = {
  TSRANGE_GIST,
  TIME_SYS_IDX,
  TIME_SOURCE_IDX
}