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

## T027: after a full lesson (SC-007)

Checks what an install and a lesson leave behind: the installed tree, its logs and caches, and a
sample report. The installed tree gets every rule above plus email addresses, phone numbers and the
Mac user name (third-party code under `node_modules/` and `runtime/` is exempt from those three only).
Logs, caches and the report get every content rule: key shape, `/Users/<name>`, email, phone, user name.
If `KNACK_EVAL_API_KEY` is set, that exact text is looked for everywhere too, even if it has no `sk-ant-`
shape. Findings are labelled `installed/...`, `logs1/...`, `logs2/...`, `report` and name only the kind,
never the matched text.

After a full lesson on an installed copy, with the sample report pasted into a file outside the repo,
scan the installed tree, the log and cache folders and the report in one go:

    node product/evals/installer/scan.mjs --after-lesson \
      --installed "$HOME/Library/Application Support/Knack" \
      --logs "$HOME/Library/Application Support/AEMentor" \
      --logs "$HOME/Library/Application Support/AEMentorBridge" \
      --logs "$HOME/Library/Caches/Knack" \
      --report <the pasted report file>

Set `KNACK_EVAL_API_KEY` to the key in the environment for that one command only (read it from the
Keychain in the shell; never write it to a file). Add `--user <name>` to check a different Mac user name
than the one running the scan. Exit 0 is clean, 1 lists findings, 2 is a usage error.

## Tests

    node --test product/evals/installer/
