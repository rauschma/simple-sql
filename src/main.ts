import { DatabaseSync } from 'node:sqlite';
import { DatabaseTable } from './db.ts';
import { ArrayType, UnionType, type TypeRecordToType } from './type-record.ts';

const htmlPageTypeRecord = {
  inputPath: 'string',
  fileSetId: 'string',
  dateTimeCreated: UnionType('string', 'null'),
  tags: ArrayType('string'),
} as const;
type HtmlPage = TypeRecordToType<typeof htmlPageTypeRecord>;
const htmlPageSqlTypes: Record<keyof HtmlPage, string> = {
  inputPath: 'TEXT NOT NULL PRIMARY KEY',
  fileSetId: 'TEXT NOT NULL',
  dateTimeCreated: 'TEXT',
  tags: 'TEXT NOT NULL',
};

function main() {
  const db = new DatabaseTable({
    db: new DatabaseSync(':memory:'),
    tableName: 'pages',
    typeRecord: htmlPageTypeRecord,
    sqlTypes: htmlPageSqlTypes,
    jsToSql: (js) => ({
      fileSetId: js.fileSetId,
      inputPath: js.inputPath,
      dateTimeCreated: js.dateTimeCreated,
      tags: js.tags.join(','),
    }),
    sqlToJs: (sql) => (
      {
        fileSetId: sql.fileSetId,
        inputPath: sql.inputPath,
        dateTimeCreated: sql.dateTimeCreated,
        tags: sql.tags.split(','),
      } satisfies HtmlPage
    ),
  });

  db.createTable();
  const insert = db.insert();
  insert.run({
    fileSetId: 'post',
    inputPath: '2017/01/intro.md',
    dateTimeCreated: '2017-01-13',
    tags: ['dev', 'typescript'],  
  });
  insert.run({
    fileSetId: 'post',
    inputPath: '2017/01/more.md',
    dateTimeCreated: '2017-01-15',
    tags: ['dev', 'typescript'],  
  });
  insert.run({
    fileSetId: 'page',
    inputPath: 'p/about.md',
    dateTimeCreated: '2017-01-15',
    tags: [],
  });
  const select = db.select({fileSetId: 'post'}, {dateTimeCreated: 'DESC'});
  for (const obj of select.all()) {
    console.log(obj);
  }
}

main();