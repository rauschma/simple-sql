import { DatabaseSync } from 'node:sqlite';
import { DatabaseTable } from './database-table.ts';
import { sql } from './sql-template-tag.ts';
import { createColEnum, pickProps, type SqlTypeMap, type SqlTypeMapToSqlObj } from './sql-type-map.ts';

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

/**
 * - An SqlTypeMap can be converted to a type.
 * - databaseTable.select() uses that to return typed results.
 */
type _PageSql = SqlTypeMapToSqlObj<typeof pageSqlTypes>;

function main() {
  const db = new DatabaseSync(':memory:');
  const pagesTable = new DatabaseTable({
    db,
    tableName: 'pages',
    sqlTypeMap: pageSqlTypes,
    logSql: true,
  });

  pagesTable.createTable();
  const replace = pagesTable.replace();
  replace.run({
    fileSetId: 'post',
    inputPath: '2017/01/intro.md',
    updatedDateTime: '2017-01-13',
    updatedYear: '2017',
    tags: 'dev,typescript',
  });
  replace.run({
    fileSetId: 'post',
    inputPath: '2017/01/more.md',
    updatedDateTime: '2017-01-15',
    updatedYear: '2017',
    tags: 'dev,typescript',  
  });
  replace.run({
    fileSetId: 'solo',
    inputPath: 'p/about.md',
    updatedDateTime: '2017-01-15',
    updatedYear: '2017',
    tags: '',
  });

  {
    const select = pagesTable.select(
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
    const inputPathSqlTypes = pickProps(pageSqlTypes, 'inputPath');
    const select = pagesTable.select(inputPathSqlTypes);
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
  {
    const countStarSqlTypes = {
      'COUNT(*)': 'INTEGER',
    } as const satisfies SqlTypeMap;
    const select = pagesTable.select(countStarSqlTypes);
    for (const obj of select.all()) {
      console.log(obj);
    }
  }
  {
    const yearMaxUpdatedSqlTypes = {
      [Col.updatedYear.name]: 'TEXT',
      [`max(${Col.updatedDateTime.name})`]: 'TEXT',
    } as const satisfies SqlTypeMap;
    const select = pagesTable.select(
      yearMaxUpdatedSqlTypes,
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