# Tiger Temple

A demo online slot on a made-up casino site ("Aurum Spins"), built to show how slot games work and how the house wins. It uses play-money credits only: no real money, no deposits, no prizes.

**▶ Play it here: https://iohnzab.github.io/tiger-temple-slot/**

Or open `index.html` in a browser. There is nothing to install.

## The game

- 5 reels, 3 rows, 10 paylines. The tiger is wild; gold coins are scatters.
- **Free spins:** 3+ coins anywhere give 10, 15 or 20 free spins.
- **Sticky Wilds:** during free spins, tigers on reels 2 to 4 lock in place until the bonus ends.
- **Coin Collector:** during free spins, each single coin adds +1 spin.
- **Tiger Rush:** on about 1 paid spin in 50, 2 to 4 random symbols turn wild.
- Big win screens, auto play, turbo, sound, and the space bar to spin.

## How the house wins

The reel weights and the paytable fix the **RTP** (return to player) before anyone spins. The page lets you:

- set the RTP from 70% to 120%. Every payout scales, but the hit rate stays the same, so the difference is hard to feel.
- compare your own session RTP with a 1,000,000-spin simulation that settles on the designed number.

## Measuring the RTP

`BASE_RTP` in `index.html` comes from simulation, because sticky wilds carry over from spin to spin and can't be calculated exactly. Re-run it after changing any weight, pay or feature:

```bash
node measure-rtp.js            # 40M rounds, about 6 minutes on 8 cores
node measure-rtp.js 4000000    # quick check, about ±0.8%
```

Current math: RTP 95.35% (±0.24), 62% from regular spins and 34% from the bonus. The bonus triggers 1 in 157 spins and pays 53x bet on average.
