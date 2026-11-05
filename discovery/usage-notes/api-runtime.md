# Option A runtime: usage notes

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
