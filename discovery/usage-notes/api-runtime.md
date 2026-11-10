# Option A runtime: usage notes

## Live lessons on A (T021, 2026-11-09, 19:43 to 19:50 local, at `229dc0e`)

Three easing lessons in the panel on Mentor Practice, `"runtime": "a"` (set 17:20), the helper
(`panel/helper/main.mjs`) as the only mentor process and no `claude -p`. A find-next hand-over just before
(19:42) is left out. Times and costs are from `panel-turns.jsonl`, tool calls from `calls.jsonl`.

| Lesson | Turns | Demo | Checks | Passed | Cost | First activity, longest |
|---|---|---|---|---|---|---|
| 1, Title and CTRL (6 pairs) | start, ask, show me, show me again, check, check | 1 (`set_ease`, Title Position) | 2 | 2nd check | $0.21 | 5.0 s |
| 2, Bar (3 pairs, separated X) | the same | 1 (`set_ease`, Subtitle Opacity) | 2 | 2nd check | $0.25 | 4.9 s |
| 3, Title review (5 pairs) | start, ask, show me ×2, check, check | none (a review) | 2 | 2nd check | $0.22 | 5.9 s |

- **SC-001:** each check's list matched AE every time (builder's confirmation; the check results aren't in
  the logs). Every tool call returned ok, with no `AE_UNREACHABLE` or `AE_BUSY`.
- **Speed:** 18 of 18 turns had first activity ≤ 10 s, median 2.4 s. **Cost:** median lesson $0.22, below
  SC-004's $0.40. These feed T048, which still needs B1's median next to it.
- **Lesson 3 was a review, not a first lesson:** the record already had easing, so the mentor opened a review.
  It turned down both show-me requests and gave the steps in words, which is right for a review (one demo per
  lesson, none in a review). So the a–f path with a demo ran twice, not three times.
- **`node panel/dev/turns.js` doesn't split by runtime** and doesn't treat `new_lesson` as a lesson start: it
  folds every turn since 2026-11-09 16:47 into one 100-turn, $5.10 "lesson". The numbers above were worked out
  by hand. Fix before T048 (panel-builder).

## Pivot fix and re-runs (2026-11-06)

Pivot B1 51/51 and A 50/51 at `c2d5f8d`; easing A 27/28 on the new helper. No A timeouts in about 260 turns
(load up to 14). Credit about $26.85 in all.

- **A new rule broke two cases, on both runtimes:** the "done before the walk-through" rule treated a moved group
  pivot as nothing changed (case 20), and the model kept the watch offer 6 of 6 though the rule said not to
  (case 46). The second was resolved by allowing the offer, since step 4's wording was pulling the other way.
- **An overloaded machine wrecks B1, not A:** B1 had 11 `ETIMEDOUT`s at load 48 with memory nearly full; A's run
  just after had none. B1 spawns a whole Claude Code per turn.

## Request timing, live (T068, 2026-11-04, about 23:42 to 23:54 local)

258 live requests, none stalled, about $1.13: 222 first requests alternating easing and pivot (2 of them to check
cost), 34 from full easing turns, and 2 hard questions to draw out thinking.

| | p50 | p95 | Longest |
|---|---|---|---|
| Time to headers | 1.1 s | 2.2 s | 4.7 s |
| Longest gap between bytes, per request | 0.4 s | 1.6 s | 4.2 s |

- **What this backs:** the 20 s and 30 s limits sit well above all of it. Pings arrived in both silent thinking
  waits that were checked.
- **What it doesn't cover:** bodies were 99 kB at most, so no real frame and no slow uplink, and the longest answer
  took about 10 s, so no long silent think. One quiet hour on one network. `response_timing` in the helper's log
  now records `headers_ms` and `max_gap_ms` for every request, so real lessons can check the limits.
- **Stall fix (merged, cause not found):** a stalled request now fails fast and retries, proven only against the
  fake service. The header wait grows with body size (50 kB/s), so a stalled 5 MB request takes 120 s to notice.

## All six sets on A (2026-11-04, at `4edba27`)

Easing 26/28, key types 28/30, speed graph 28/29, offset 33/37, pivot 48/50, null 43/44. Mentor $11.78 for the
full runs, $1.73 for repeats, so about $17.26 of credit used so far. Judge $29.19 on the subscription.

- **Timeouts are only in easing:** 2 in this round, and the other five sets had 0 in about 515 turns, with load
  peaking around 24 during pivot. So load doesn't look like the cause. T068 looks into it.
- **Controls earned their cost:** pivot 14 and key types 22 looked like A regressions until B1 failed them too on
  the same commit (1/3 each). A single baseline pass isn't reliable evidence.
- **Pivot 14:** the hint runs on into the walk-through's wording (`SKILL.md:269`, suspected). T035.
- **Key types 22:** a fixed fixture date ages out of the check's pattern. T069.
- **Judge share:** on heavy sets the judge now costs more than the mentor (pivot: $7.05 against $2.30).

## Easing eval on A (2026-11-04, T030 to T034)

25/28 raw against B1's 27/28; every miss passed on re-run and by majority on `--repeat 3`. Credit: $2.03 for
the full run, $3.36 for the whole brief. Results: `product/evals/easing/results/2026-11-04-150619.json`.

### To fix later

- **Turn timeouts:** 4 turns hit the helper's 5-minute limit across about 130 mentor turns, and a fifth call
  ended `offline`. Machine load was 3 to 4, with other agents running. Cause not found (network, service or
  helper). Fine for an eval, but a learner would sit through a 5-minute stall. Find the cause, and consider a
  shorter wait plus one retry. Log it in T048.
- **Judge reply cut off** (case 23): retry once in the runner.
- **Token counts:** the results file doesn't save them, so the cache share took a one-off probe (92.5% on
  case 06). Save `end.tokens` through `mapTurn()`.
- **Record wording:** case 06 flaked once on R-RECORD-HONEST ("Basic Easy Ease" names the method).
- **Partial B1 runs:** a B1 `--only` run compared itself against an A `--only` file.

### Costs here run below a learner's

Eval cases are 1 to 4 turns and run back to back, so the cache stays warm. A real lesson has more turns and
starts cold (T016's fixture opening cost $0.06). T048 measures that.
