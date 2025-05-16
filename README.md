# TypeScript experiment: simple type-safe access to `node:sqlite`

## Goals

1. Use as much SQL as possible.
2. Return statically typed “SQL objects”.
3. Use an enum with column names to prevent typos and make renaming easy.
4. Support automatic quoting of literal values in queries.

### Template tag `sql`

#3 and #4 are supported via the template tag `sql`:

```ts
const select = pagesTable.select(
  '*',
  sql`
    WHERE ${Col.fileSetId} = ${'post'}
    ORDER BY ${Col.updatedDateTime} DESC
  `
);
```

* `Col.fileSetId` comes from an automatically (and dynamically) generated enum of column names.
* `'post'` is passed to the SQL engine via substitution (`?`).

The first line comes from `.select()`, the remaining lines from the template tag:

```sql
SELECT inputPath, fileSetId, updatedDateTime, updatedYear, tags FROM pages
WHERE fileSetId = ?
ORDER BY updatedDateTime DESC
```

## Using the API

* Define the _SQL type map_ `pageSqlTypes` for a table.
* Automatically derive the enum object `Col` with column names.

```ts
const pageSqlTypes = {
  inputPath: 'TEXT NOT NULL PRIMARY KEY',
  fileSetId: 'TEXT NOT NULL', // 'post' | 'solo'
  updatedDateTime: 'TEXT',
  updatedYear: 'TEXT',
  tags: 'TEXT NOT NULL',
} as const satisfies SqlTypeMap;
const Col = createColEnum(pageSqlTypes);
```

Create a wrapper for table `pages` – whose columns are specified via `pageSqlTypes` (line A):

```ts
const db = new DatabaseSync(':memory:');
const pagesTable = new DatabaseTable({
  db,
  tableName: 'pages',
  sqlTypeMap: pageSqlTypes, // (A)
});
```

Query the table:

```ts
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
```

We can also query a subset of all columns – which is again defined via an SQL type map:

```ts
const inputPathSqlTypes = pickProps(pageSqlTypes, 'inputPath');
const select = pagesTable.select(inputPathSqlTypes);
```

**More examples:** See [`src/main.ts`](https://github.com/rauschma/simple-sql/blob/main/src/main.ts).

## Installation

Only needed if you want to edit the code (this project only has dev dependencies):

```js
cd simple-sql/
npm install
```

## Running the code

**Requires Node.js v22.6.0+:**

```js
node src/main.ts
```
