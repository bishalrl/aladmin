#!/usr/bin/env bash
# One-shot root-cause diagnostic for YantraMed payment API on nest
# Run: bash /root/code/aladmin/scripts/diagnose-payment-deploy.sh
set -euo pipefail
cd /root/code/aladmin

echo "========== 1. GIT =========="
echo "HEAD: $(git rev-parse HEAD)"
echo "LOG:  $(git log -1 --oneline)"
echo "BRANCH: $(git branch --show-current)"
echo "REMOTE main: $(git ls-remote origin refs/heads/main | awk '{print $1}')"
if [[ "$(git rev-parse HEAD)" != "$(git ls-remote origin refs/heads/main | awk '{print $1}')" ]]; then
  echo "PROBLEM: server HEAD != origin/main — code is OUT OF DATE. Run: git pull origin main"
else
  echo "OK: server matches origin/main"
fi

echo ""
echo "========== 2. SOURCE FILES =========="
for f in \
  src/app/api/v1/yantramed/payment/url/route.ts \
  src/app/subscribe/page.tsx \
  src/services/YantramedAppService.ts \
  src/lib/auth/paymentSession.ts \
  src/lib/firebase/verifyIdToken.ts
do
  if [[ -f "$f" ]]; then echo "OK  $f"; else echo "MISSING  $f"; fi
done
grep -n payment_url_api src/services/YantramedAppService.ts || echo "PROBLEM: YantramedAppService has no payment_url_api"

echo ""
echo "========== 3. NODE MODULES (build deps) =========="
node -e "require('@tailwindcss/postcss'); console.log('OK @tailwindcss/postcss')" 2>&1 || echo "MISSING @tailwindcss/postcss — run: npm install --include=dev"
node -e "require('tailwindcss'); console.log('OK tailwindcss')" 2>&1 || echo "MISSING tailwindcss"
node -e "require('firebase'); console.log('OK firebase')" 2>&1 || echo "MISSING firebase"
node -e "require('firebase-admin'); console.log('OK firebase-admin')" 2>&1 || echo "MISSING firebase-admin"

echo ""
echo "========== 4. BUILD OUTPUT (.next routes) =========="
if [[ ! -d .next ]]; then
  echo "PROBLEM: .next missing — build never succeeded"
else
  echo "OK .next exists"
  # Next 16 app path routes
  if [[ -f .next/app-path-routes-manifest.json ]]; then
    echo "--- app-path-routes-manifest (payment/subscribe) ---"
    grep -E 'payment|subscribe' .next/app-path-routes-manifest.json || echo "PROBLEM: payment/subscribe NOT in built routes manifest"
  fi
  if [[ -f .next/server/app-paths-manifest.json ]]; then
    echo "--- app-paths-manifest ---"
    grep -E 'payment|subscribe' .next/server/app-paths-manifest.json || echo "PROBLEM: payment/subscribe NOT in server app-paths-manifest"
  fi
  find .next/server/app/api/v1/yantramed -maxdepth 3 -type d 2>/dev/null | head -40 || echo "no yantramed api dirs in .next"
fi

echo ""
echo "========== 5. DATABASE =========="
grep '^DATABASE_URL=' .env | sed 's#://[^:]*:[^@]*@#://USER:***@#' || echo "NO DATABASE_URL in .env"
npx prisma db execute --schema prisma/schema.prisma --stdin <<<'SELECT 1;' 2>&1 | tail -5

echo ""
echo "========== 6. PM2 PROCESS =========="
pm2 describe aladmin 2>/dev/null | egrep 'status|script path|exec cwd|pid|node' || pm2 list
PID=$(pm2 pid aladmin 2>/dev/null || true)
if [[ -n "${PID:-}" && "$PID" != "0" ]]; then
  echo "PID=$PID"
  echo "cwd: $(readlink -f /proc/$PID/cwd 2>/dev/null || true)"
  tr '\0' '\n' < /proc/$PID/environ 2>/dev/null | grep '^DATABASE_URL=' | sed 's#://[^:]*:[^@]*@#://USER:***@#' || echo "NO DATABASE_URL in process env (Next may load .env from cwd)"
  tr '\0' '\n' < /proc/$PID/environ 2>/dev/null | grep '^PWD=\|^NODE_ENV=' || true
fi

echo ""
echo "========== 7. LOCAL HTTP =========="
echo -n "GET /api/v1/yantramed/payment/url -> "
CODE=$(curl -s -o /tmp/pay_body.txt -w "%{http_code}" http://127.0.0.1:3200/api/v1/yantramed/payment/url)
echo "HTTP $CODE"
head -c 180 /tmp/pay_body.txt; echo
echo -n "GET /api/v1/yantramed/app payment_url_api -> "
curl -s http://127.0.0.1:3200/api/v1/yantramed/app | grep -o '"payment_url_api":"[^"]*"' || echo "MISSING in response (old build)"

echo ""
echo "========== VERDICT =========="
if [[ "$CODE" == "404" ]]; then
  echo "ROOT CAUSE: running .next build does NOT contain /payment/url"
  echo "FIX: ensure source file exists + npm install --include=dev + rm -rf .next && npm run build + pm2 restart"
elif [[ "$CODE" == "401" ]] || grep -q 'UNAUTHORIZED\|Authorization Bearer' /tmp/pay_body.txt; then
  echo "ROOT CAUSE for mobile is NOT this API missing — endpoint is live."
  echo "Mobile must send Authorization: Bearer <Firebase ID token>"
elif [[ "$CODE" == "200" ]]; then
  echo "Endpoint OK"
else
  echo "Unexpected HTTP $CODE — see body above and pm2 logs"
fi
