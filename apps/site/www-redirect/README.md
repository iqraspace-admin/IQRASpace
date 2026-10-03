# www → apex redirect Worker

`www.iqraspace.org/*` → `https://iqraspace.org/*` (301, path and query preserved).
Bound only to the www host, so it cannot see or loop on apex traffic. Deployed once by hand
(it rarely changes; CI does not deploy it):

    cd apps/site/www-redirect && npx wrangler deploy
