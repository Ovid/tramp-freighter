#!/usr/bin/env bash
# Lint: forbid hardcoded pixel font-sizes in CSS.
# All font-size declarations must use var(--font-size-*) variables so that
# mobile overrides in variables.css apply consistently.
#
# Allowed exceptions:
#   - 24px and above (large display/title sizes already readable on mobile)
#   - css/variables.css (where the variables themselves are defined)

set -euo pipefail

violations=$(
  grep -rn 'font-size:[[:space:]]*[0-9]*px' css/ \
    --include='*.css' \
    | grep -v 'css/variables.css' \
    | grep -vE 'font-size:[[:space:]]*(2[4-9]|[3-9][0-9]|[0-9]{3,})px' \
  || true
)

if [ -n "$violations" ]; then
  echo ""
  echo "ERROR: Hardcoded pixel font-sizes found in CSS files."
  echo ""
  echo "Use a --font-size-* variable from css/variables.css instead:"
  echo "  --font-size-small    (desktop 11px, mobile 14px)"
  echo "  --font-size-normal   (desktop 12px, mobile 16px)"
  echo "  --font-size-medium   (desktop 13px, mobile 17px)"
  echo "  --font-size-large    (desktop 14px, mobile 18px)"
  echo "  --font-size-xlarge   (desktop 16px, mobile 20px)"
  echo "  --font-size-xxlarge  (desktop 18px, mobile 22px)"
  echo "  --font-size-title    (desktop 22px, mobile 26px)"
  echo ""
  echo "Violations:"
  echo "$violations"
  echo ""
  exit 1
fi
