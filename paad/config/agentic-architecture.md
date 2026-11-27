Pass these rules to every specialist and to the verifier.

Impact rubric. A flaw may be rated High or Medium only if the finding states a
concrete failure scenario: the input or state, and the wrong outcome a player
or developer would actually see (wrong number shown, data lost, crash, a
change that must be made in two places and today disagrees). A flaw with no
such scenario is Low, and its explanation says "structural only". Rate by the
scenario, not by how untidy the code looks.

Verifier: check each finding's consequence, not only that its evidence exists.
Re-check the claim that makes the finding matter:
- "Two copies can drift": compare the copies with a concrete input and say
  whether they disagree today. If they agree, say so and rate it Low.
- "Missing event / stale state": find the subscribers and check whether any is
  mounted across the transition. If every subscriber mounts afterwards and
  reads fresh state, there is no bug.
- "X bypasses the sanctioned path": compare the bypass line by line with the
  sanctioned path and name what it skips. If it skips nothing, it is cosmetic.
- "Bypassed even where facade methods exist": name the facade method for each
  call site.
- Cited enum, map or registry entries: confirm each entry exists.
Drop a finding, or downgrade it to Low, when its consequence claim fails.

Implied fixes. If a finding implies a fix direction (for example "return
copies from getState"), check that the problem actually flows through that
place before writing the direction into the report.
