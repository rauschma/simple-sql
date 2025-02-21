# Experiment: simple type-safe access to `node:sqlite`

I wondered what a tiny type-safe SQL library would look like:

* My immediate use case is very simple: An app that doesn’t much more than insert table rows and select table rows (with simple search criteria).
* I wanted to write SQL – not use a JS API to write queries.
* I wanted static safety for property names.

What if the functionality isn’t enough?

* My current thinking is that I won’t turn this into a generic library. Instead, I’ll simply manually add all functionality to `DatabaseTable` that I need for a particular project.
* However, as I do that, useful primitives may emerge and those could be extracted to a library.

## Installation

Only needed if you want to edit the code – it only installs `@types/node`:

```js
cd simple-sql/
npm install
```

## Running the code

**Requires Node.js v22.6.0+:**

```js
node src/main.ts
```
