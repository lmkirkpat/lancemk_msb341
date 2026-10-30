# Quickstart: Option A Runtime

How to check spec 013 end to end. Each section names the success criterion it proves. Contracts:
[helper-protocol.md](contracts/helper-protocol.md), [eval-runtime.md](contracts/eval-runtime.md).

## §1 Setup (builder, once)

1. `bash panel/install.sh` (installs the helper's pinned SDK with `npm ci` in `panel/helper/` and
   keeps `panel.json`'s `runtime` if set).
2. Store your access key in the Keychain:
   `security add-generic-password -s Knack -a anthropic-api-key -w` (it prompts for the key; nothing
   is echoed or saved in shell history).
3. For eval runs only, in that shell: `read -s KNACK_EVAL_API_KEY && export KNACK_EVAL_API_KEY`.
   Don't use `ANTHROPIC_API_KEY`: Claude Code (the judge and B1) would pick it up.
4. Check the key: `node panel/helper/dev/chat.mjs --key-check` → `works`.

## §2 Unit tests (no AE, no service)

```bash
cd panel/helper && npm test     # loop, prompt, MCP client, errors, cost, conversation, key handling
cd panel && npm test            # A adapter, config, turn log; B1 tests unchanged (SC-009)
```

Expected: all pass. The helper's tests use a fake Messages service and the real `ae-mentor` in
fixture mode.

## §3 Faults (SC-006, no AE)

`cd panel/helper && node --test test/faults.test.mjs` covers the 7 faults with faked service
responses: no key, rejected key, out of credit, rate limited, overloaded, offline, `ae-mentor`
can't start. Then the builder reads each message as the panel shows it (`panel/dev/drive.js
--runtime a --fault <kind>`), checking: plain words, no status code, path, tool name or key, and no
check result for that turn. 7 of 7.

## §4 Eval comparison (SC-003, SC-008; about $115)

```bash
node product/evals/easing/run.mjs --runtime a --dry-run
node product/evals/easing/run.mjs --runtime a
```

Read the summary's "vs B1 baseline" line. **Stop rule** (Q4): if easing is more than 5 points
below B1, stop and triage (`/eval-triage`) before the other sets. Otherwise run key types, speed
graph, offset, pivot (`anchor`) and null the same way, then `--repeat 3` on each case that passed on
B1 and failed on A. Record each set's outcome in its README › Option A. Every case's allowlist
check must pass (SC-008).

If a fix to a `SKILL.md` or tool lands, re-run that set on B1 on the same commit first (FR-034).

## §5 Live lessons in the panel (SC-001, SC-002, SC-004; AE, one sitting)

Hold the AE lock (`ae_status`, and no other holder in `.git/knack-agents/ae.lock.json` from the
last 10 minutes). Set `"runtime": "a"` in `panel.json`, quit Claude Code everywhere, restart AE,
open Mentor Practice, and run spec 003's quickstart §4 steps a–f three times. During each lesson:
no terminal, `pgrep -x claude` finds nothing. After: `node panel/dev/turns.js` reports, per
runtime, the share of turns with first activity ≤ 10 s (≥ 9 of 10 over ≥ 10 turns), the median, and
the median lesson cost (≤ $0.40). Log with `/usage-session` in
`discovery/usage-notes/api-runtime.md`.

## §6 Continue a lesson (SC-007; AE)

Start a lesson, get past the demo, close the panel, reopen it, press Continue lesson, then Show me.
Pass: no second demonstration, and the mentor refers to the earlier part correctly. 3 of 3. The
automated half: `test/conversation.test.mjs` checks that the resumed request's history equals the
saved one byte for byte.

## §7 Other skills and a hand-over (FR-014, FR-039; AE)

`node panel/helper/dev/chat.mjs --skill offset-mentor` on the live comp: a short lesson runs with
offset's tools only. Then `--skill next-mentor`: accept its suggestion and check the next turn runs
the suggested skill (its tools, its opening).

## §8 Key scan (SC-005)

After §4's runs and one §5 lesson: `node product/evals/lib/key-scan.mjs --home "<learner home>"
--results product/evals` (reads the key from `KNACK_EVAL_API_KEY`; prints only counts). Expected: 0
occurrences in files, logs, saved conversations, results and a copied setup report, and in the
environments of the helper's and `ae-mentor`'s processes during a lesson.

## §9 B1 unchanged (SC-009)

With `runtime` missing or `"b1"`: `cd panel && npm test`, then `node product/evals/easing/run.mjs`
(no `--runtime`). Expected: within noise of the 2026-10-29 baseline (27/28).
