Independent researcher, no employer and no team. I work on verification method: establishing what
is verifiably true about shipped software from public evidence alone, with a reproducible
procedure and explicit controls.

## Repos

- **[scrubwatch](https://github.com/ChetasLua/scrubwatch)** — reads the edit history of public
  GitHub issue, pull-request and comment bodies and prints the text that was edited out. Comment
  edit history is public by design on a public repository — GitHub documents that anyone with
  read access can view it — so the tool automates access to data that was already readable, and
  is not a disclosure finding. Unauthenticated, and the requests are github.com routes rather
  than API calls, so a sweep spends none of the api.github.com quota. `--selftest` measures that,
  alongside what the same request returns for a body with no edit history, for an invalid node
  id, and with the one load-bearing header removed. Status codes and byte counts.
- **[negative-controls](https://github.com/ChetasLua/negative-controls)** — a small harness that
  refuses to report an absence unless a positive control passed in the same run, plus three cases
  where I read a broken query as a real zero.

## Method

- Settle a question with a first-party experiment and raw numbers, not with someone else's summary.
- Validate the instrument before trusting the result. A positive control that must return
  something, a negative control that must return nothing, one variable changed at a time.
- State the objection that survives. An untested alternative explanation belongs next to the
  result, not in a footnote.

Each repo records what was measured, when, and what would falsify it.

Reachable at chetaslua@gmail.com.
