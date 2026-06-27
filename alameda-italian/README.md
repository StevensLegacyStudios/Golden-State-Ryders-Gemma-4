# 🌴 Isola — Alameda Italian

A friendly, Alameda island-themed web app for finding the best Italian food on the Island.
Single self-contained file (`index.html`) — no build, no dependencies. Just open it.

## Features
- **Live "Open Now"** — each spot shows open/closed/closing-soon, computed in real time using Pacific time (updates every minute).
- **Food photos** for every restaurant (with emoji fallback if offline).
- **Full menus** — expandable per card with signature dishes & prices.
- **One-tap contact** — call, get directions (Google Maps), website, and reserve.
- **Filters & search** — All / Open Now / Pizza / Pasta / Waterfront, plus free-text search across dishes, tags, and vibes.
- **Mobile-friendly** responsive layout.

## Run it
Open the file in any browser:

```
open alameda-italian/index.html        # macOS
xdg-open alameda-italian/index.html    # Linux
```

Or serve locally:

```
python3 -m http.server 8000
# then visit http://localhost:8000/alameda-italian/
```

## The spots
| Restaurant | Vibe | Phone |
|---|---|---|
| Trabocco Kitchen & Cocktails | Upscale Abruzzo, patio | (510) 521-1152 |
| The Star on Park | Chicago deep-dish + bar | (510) 832-7827 |
| Tomatina | Casual family pasta/pizza | (510) 521-1000 |
| Pasta Pelican | Waterfront Italian | (510) 864-7427 |
| Pizzeria Pappo | Wood-fired thin crust | (510) 473-0613 |

> Hours and prices are approximate and compiled from each restaurant's website and
> public listings. Please call ahead to confirm, especially on holidays.
