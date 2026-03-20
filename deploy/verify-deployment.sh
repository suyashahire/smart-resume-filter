#!/usr/bin/env bash
set -euo pipefail

# HireQ — Post-deployment verification script
# Run after deploying to verify everything is working.
#
# Usage:
#   ./deploy/verify-deployment.sh                     # Uses default domain
#   ./deploy/verify-deployment.sh api.example.com example.com

API_HOST="${1:-api.hireq.tech}"
FRONTEND_HOST="${2:-hireq.tech}"
API_URL="https://${API_HOST}"
FRONTEND_URL="https://${FRONTEND_HOST}"

PASS=0
FAIL=0
WARN=0

check() {
  local label="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo "  ✓ ${label}"
    ((PASS++))
  else
    echo "  ✗ ${label}"
    ((FAIL++))
  fi
}

warn_check() {
  local label="$1"
  shift
  if "$@" > /dev/null 2>&1; then
    echo "  ✓ ${label}"
    ((PASS++))
  else
    echo "  ⚠ ${label} (non-critical)"
    ((WARN++))
  fi
}

echo ""
echo "========================================"
echo "  HireQ Deployment Verification"
echo "========================================"
echo ""
echo "API:      ${API_URL}"
echo "Frontend: ${FRONTEND_URL}"
echo ""

# --- Backend checks ---
echo "Backend:"
check "API health endpoint" curl -sf "${API_URL}/api/health"
check "API root endpoint" curl -sf "${API_URL}/"
check "HTTPS redirect" bash -c "curl -sf -o /dev/null -w '%{http_code}' http://${API_HOST}/ | grep -q '301\|302\|308'"

# Check response content
HEALTH=$(curl -sf "${API_URL}/api/health" 2>/dev/null || echo '{}')
check "Database connected" bash -c "echo '${HEALTH}' | grep -q 'connected'"

# Check security headers
echo ""
echo "Security Headers (API):"
HEADERS=$(curl -sI "${API_URL}/api/health" 2>/dev/null || echo "")
check "X-Content-Type-Options" bash -c "echo '${HEADERS}' | grep -qi 'x-content-type-options'"
check "X-Frame-Options" bash -c "echo '${HEADERS}' | grep -qi 'x-frame-options'"
check "Referrer-Policy" bash -c "echo '${HEADERS}' | grep -qi 'referrer-policy'"
warn_check "Strict-Transport-Security" bash -c "echo '${HEADERS}' | grep -qi 'strict-transport-security'"

# --- Frontend checks ---
echo ""
echo "Frontend:"
check "Landing page loads" curl -sf "${FRONTEND_URL}/"
check "HTTPS valid" bash -c "curl -sf -o /dev/null '${FRONTEND_URL}/'"

# Check frontend security headers
FE_HEADERS=$(curl -sI "${FRONTEND_URL}/" 2>/dev/null || echo "")
check "CSP header present" bash -c "echo '${FE_HEADERS}' | grep -qi 'content-security-policy'"
check "X-Frame-Options" bash -c "echo '${FE_HEADERS}' | grep -qi 'x-frame-options'"

# --- SSL checks ---
echo ""
echo "SSL Certificates:"
check "API SSL valid" bash -c "echo | openssl s_client -servername ${API_HOST} -connect ${API_HOST}:443 2>/dev/null | grep -q 'Verify return code: 0'"
check "Frontend SSL valid" bash -c "echo | openssl s_client -servername ${FRONTEND_HOST} -connect ${FRONTEND_HOST}:443 2>/dev/null | grep -q 'Verify return code: 0'"

# --- Summary ---
echo ""
echo "========================================"
echo "  Results: ${PASS} passed, ${FAIL} failed, ${WARN} warnings"
echo "========================================"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "Some checks failed. Review the output above."
  exit 1
else
  echo "All critical checks passed!"
  exit 0
fi
