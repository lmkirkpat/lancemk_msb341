# Knack's option A helper

A small Node program that runs one mentor lesson on the Claude API
([spec 013](../../specs/013-api-runtime/spec.md), `decisions/010`). The panel starts one helper
process per lesson. The helper loads the mentor skill, starts `ae-mentor`, runs the agent loop and
sends the panel what happens as JSON lines. The eval runners and `dev/chat.mjs` start it the same
way.

**It holds no teaching logic.** What to teach is in the skills (`.claude/skills/`), and the checks
are in `mentor/`. The helper passes messages and tool results along unchanged. It never reads or
writes the After Effects project, `session.json` or `learner.json`; only `ae-mentor` does.

## Protocol

[`contracts/helper-protocol.md`](../../specs/013-api-runtime/contracts/helper-protocol.md) defines
the commands (`start`, `send`, `stop`, `key_check`), the events and the error kinds.

## Setup

After a fresh checkout, run `npm ci` here (the SDK isn't committed). `bash panel/install.sh` does
this too. To switch the panel between runtimes, run `bash panel/install.sh --runtime a|b1`, then
restart After Effects.

## Settings

`settings.json` sets the model, effort, thinking display, cache lifetime, where the skill goes in
the prompt, the step and time limits, `max_tokens` and fallbacks. Every field is required, and an
unknown field is refused.
[`data-model.md`](../../specs/013-api-runtime/data-model.md) › Runtime settings lists each one.

`prices.json` holds the price per model, and the helper won't start on a model that isn't in it.

The helper reports a **settings hash** in `ready` and on each `turn_end`. It covers `settings.json`,
`preamble.md`, `skill-tool.json`, `main.mjs` and every `lib/*.mjs`, so changing any of those files,
or adding one to `lib/`, changes the hash that eval results are recorded against.

## The saved conversation

After each complete exchange the helper saves the lesson to `panel-conversation.json` in the
learner home, with frames as files in `panel-conversation-frames/` (`lib/conversation.mjs`). Besides
the history, the file holds the prompt state: the opening and active skill, the tools offered so
far, and a hand-over whose skill text hasn't gone in yet.

- `start` with `resume: true` continues it, if a rebuild from today's skills, preamble, server and
  settings gives the same request. Anything else (no file, damaged, another lesson or model, or a
  change to something that goes in a request) deletes it and starts the lesson fresh on the start
  command's `skill`, saying nothing to the learner. `ready.resumed` says which happened.
- `start` with `resume: false` deletes it first.
- `stop`, SIGTERM or stdin closing mid-turn: an answer whose call ran or is still running is
  completed ("That call didn't finish, …") and saved before the helper exits. Anything else in
  flight isn't saved.

[`data-model.md`](../../specs/013-api-runtime/data-model.md) › Lesson conversation has the details.

## The access key

The key is in the macOS Keychain, in the item with service `Knack` and account `anthropic-api-key`.
To store it (it prompts for the key, so it stays out of your shell history):

```bash
security add-generic-password -s Knack -a anthropic-api-key -w
```

The key stays in the helper's memory only. It never goes in an event, a log line, the saved
conversation or `ae-mentor`'s environment. The helper removes every `ANTHROPIC_*` variable from its
own environment when it starts. Eval runs pass their key in the `start` command instead.

## Tests

```bash
cd panel/helper && npm test
```

The tests use a fake Messages service (`test/fake-service.mjs`) and the real `ae-mentor` in fixture
mode, so they need no key, network or After Effects.

## Trying a lesson in the terminal

`dev/chat.mjs` is a terminal chat over the helper, for the builder only. It isn't installed for
learners. It uses the Keychain key, so a lesson spends real credit, except with `--fake-service`.
From the repo root:

```bash
node panel/helper/dev/chat.mjs --key-check
node panel/helper/dev/chat.mjs --skill ease-mentor
node panel/helper/dev/chat.mjs --skill ease-mentor --fixture product/evals/easing/fixtures/before.json
```

Without `--home` it uses a new empty folder, so your real learner record isn't touched. Without
`--fixture` it reads the comp open in After Effects. The other options are in the comment at the top
of the file. Type `/quit` or press Ctrl-D to end.
