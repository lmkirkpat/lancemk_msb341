# Installer scan (spec 006 T015)

Checks a staged installer payload for anything that must not ship (FR-005, SC-007's install half).
Written apart from the build, Node built-ins only.

It fails and lists each offending path if the folder has a `CLAUDE.md`, auto-memory files, sprint
notes, eval fixtures, a `test/` folder or `.git`, `mentor/fixture/`, an access key (the shape of a real `sk-ant-` key: a type like `api03`, then a token of 20 or more characters; code that only mentions the prefix passes), a
`/Users/<name>` path (`/Users/Shared` is allowed), or `node_modules` inside the bridge or panel
extension folders (`panel/helper` may have its own). Files are read as bytes, so Node binaries are
scanned too. Symlinks are not followed. Found keys are never printed.

## T016 runs it

After `node installer/build.mjs --channel test`:

    node product/evals/installer/scan.mjs <staged folder>

Exit 0 and `scan: clean` pass the step. Exit 1 lists `path  [kind]` lines; exit 2 is a usage error.

## Tests

    node --test product/evals/installer/
