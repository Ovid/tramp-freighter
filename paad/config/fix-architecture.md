I'm a solo developer. We should commit as we go.

Before presenting fix options, verify each option's claims against the code,
and give file:line for each:
- Every claim that something exists, does not exist, or happens only in some
  condition (for example "only while mounted").
- Every claimed difference between options. If "B can't do X" is part of the
  case for A, check that B really can't.
- Every claimed behaviour change. Name the input that triggers the old
  behaviour today; if it cannot be reached, it is not a behaviour change.
- Every claim of scope such as "owns all X". Grep for every copy of the
  formula or rule, including helpers that use the same constants.
Mark any claim you could not verify as unverified. Don't present it as fact.
