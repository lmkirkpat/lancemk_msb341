# Option A runtime: usage notes

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
