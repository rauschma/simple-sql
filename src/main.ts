import { DatabaseSync } from 'node:sqlite';
import { DatabaseTable } from './database.ts';
import { sql } from './sql-template-tag.ts';
import { createColEnum, type SqlTypeMap, type SqlTypeMapToSqlObj } from './sql-type-map.ts';
import { pick } from './util.ts';

const pageSqlTypes = {
  inputPath: 'TEXT NOT NULL PRIMARY KEY',
  fileSetId: 'TEXT NOT NULL', // 'post' | 'solo'
  updatedDateTime: 'TEXT',
  updatedYear: 'TEXT',
  tags: 'TEXT NOT NULL',
} as const satisfies SqlTypeMap;

/**
 * Type-safe access to the column names defined via
 * {@link pageSqlTypes}
 */
const Col = createColEnum(pageSqlTypes);

/** An SqlTypeMap can be converted to a type */
type _PageSql = SqlTypeMapToSqlObj<typeof pageSqlTypes>;

function main() {
  const db = new DatabaseSync(':memory:');
  const table = new DatabaseTable({
    db,
    tableName: 'pages',
    sqlTypeMap: pageSqlTypes,
    logSql: true,
  });

  table.createTable();
  const insert = table.replace();
  insert.run({
    fileSetId: 'post',
    inputPath: '2017/01/intro.md',
    updatedDateTime: '2017-01-13',
    updatedYear: '2017',
    tags: 'dev,typescript',
  });
  insert.run({
    fileSetId: 'post',
    inputPath: '2017/01/more.md',
    updatedDateTime: '2017-01-15',
    updatedYear: '2017',
    tags: 'dev,typescript',  
  });
  insert.run({
    fileSetId: 'solo',
    inputPath: 'p/about.md',
    updatedDateTime: '2017-01-15',
    updatedYear: '2017',
    tags: '',
  });

  {
    const select = table.select(
      '*',
      sql`
        WHERE ${Col.fileSetId} = ${'post'}
        ORDER BY ${Col.updatedDateTime} DESC
      `
    );
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
  {
    const inputPaths = pick(pageSqlTypes, 'inputPath');
    const select = table.select(
      inputPaths
    );
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
  {
    const inputPaths = {
      'COUNT(*)': 'INTEGER',
    } as const satisfies SqlTypeMap;
    const select = table.select(
      inputPaths
    );
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
  {
    const yearMaxUpdated = {
      [Col.updatedYear.name]: 'TEXT',
      [`max(${Col.updatedDateTime.name})`]: 'TEXT',
    } as const satisfies SqlTypeMap;
    const select = table.select(
      yearMaxUpdated,
      sql`
        WHERE ${Col.fileSetId} = ${'post'}
              AND ${Col.updatedDateTime} IS NOT NULL
              AND ${Col.updatedYear} IS NOT NULL
        GROUP BY ${Col.updatedYear}
        ORDER BY ${Col.updatedYear} DESC
      `
    );
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
}

main();