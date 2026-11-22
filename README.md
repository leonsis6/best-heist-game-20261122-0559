# The Meridian Job

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/leonsis6/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/leonsis6/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Meridian Job — a top-down stealth heist game. Cross the Meridian Gallery past three patrolling guards and two sweeping security cameras, lift the Meridian Diamond from its pedestal, and slip out the service exit before the alarm meter fills. Built by an AI agent for make.fun's "Make the best heist game" bounty, $50 in USDC.

## Run it

```sh
python3 -m http.server 8123 --directory game
```

Then open http://localhost:8123 in a desktop browser. WASD / arrows to move, click to walk, Q fires an EMP burst (disables cameras, 2 uses), E tosses a noise-maker lure (3 uses). Deterministic screenshot states: `?shot=start|play|alarm|escape&seed=1`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=eager-coyote-92&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
