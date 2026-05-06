# ★ ASCII Weather Globe

A rotating ASCII Earth that pins any city you type and shows the live weather there. No API key, no backend, no build step — just three vanilla files.

**Try it:** [imfuz.github.io/ascii-weather-globe](https://imfuz.github.io/ascii-weather-globe/)

```
              ·····=*#%··                           ┌──────────────────────────────┐
           ········=+*#%@···                        │  Tokyo                       │
         ··········=+*#%@@····                      │  Japan                       │
       ············=+*#%@@@····                     ├──────────────────────────────┤
      ·············=+*#%@@@@····                    │  ☀  Clear sky                │
     ··············=+*#%@@@@@····                   │  18.4°C                      │
     ··············=+*#%@@@@★@····                  │  Wind  6.1 km/h              │
     ··············=+*#%@@@@@····                   │  RH    52%                   │
      ·············=+*#%@@@@····                    ├──────────────────────────────┤
       ············=+*#%@@@····                     │  35.69°N  139.69°E           │
         ··········=+*#%@@····                      └──────────────────────────────┘
            ········=+*#%··
```

## How it works

- **Rotation** — each frame projects a unit sphere with `requestAnimationFrame`, mapping `(lat, lon)` to a 64×32 character grid via orthographic projection. Depth (`z`) picks a shade from `.:-=+*#%@`.
- **Continents** — a small hand-tuned set of lat/lon rectangles approximates the major landmasses. Crude, but recognisable as Earth at this resolution.
- **Weather** — [Open-Meteo](https://open-meteo.com)'s free, key-less APIs handle both city → lat/lon (geocoding) and lat/lon → current conditions.

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

That's it — no `npm install`, no toolchain.

## Credits

- Weather and geocoding: [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- Everything else: vanilla HTML / CSS / JS

## License

[MIT](LICENSE)
