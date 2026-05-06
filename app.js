// ASCII Weather Globe — input + Open-Meteo data flow.
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const globeEl = $('globe');
  const weatherEl = $('weather');
  const statusEl = $('status');
  const form = $('search');
  const cityInput = $('city');
  const button = form.querySelector('button');

  // WMO weather codes -> [glyph, label]
  // https://open-meteo.com/en/docs (Weather variable documentation)
  const WMO = {
    0:  ['☀', 'Clear sky'],
    1:  ['☀', 'Mainly clear'],
    2:  ['⛅', 'Partly cloudy'],
    3:  ['☁', 'Overcast'],
    45: ['🌫', 'Fog'],
    48: ['🌫', 'Depositing rime fog'],
    51: ['☂', 'Light drizzle'],
    53: ['☂', 'Moderate drizzle'],
    55: ['☂', 'Dense drizzle'],
    56: ['☂', 'Light freezing drizzle'],
    57: ['☂', 'Dense freezing drizzle'],
    61: ['☂', 'Light rain'],
    63: ['☂', 'Moderate rain'],
    65: ['☂', 'Heavy rain'],
    66: ['☂', 'Light freezing rain'],
    67: ['☂', 'Heavy freezing rain'],
    71: ['❄', 'Light snow'],
    73: ['❄', 'Moderate snow'],
    75: ['❄', 'Heavy snow'],
    77: ['❄', 'Snow grains'],
    80: ['☂', 'Rain showers'],
    81: ['☂', 'Heavy rain showers'],
    82: ['☂', 'Violent rain showers'],
    85: ['❄', 'Snow showers'],
    86: ['❄', 'Heavy snow showers'],
    95: ['⛈', 'Thunderstorm'],
    96: ['⛈', 'Thunderstorm with hail'],
    99: ['⛈', 'Thunderstorm with heavy hail'],
  };

  function setStatus(msg, isErr) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('err', !!isErr);
  }

  function pad(s, n) {
    s = String(s);
    return s.length >= n ? s : s + ' '.repeat(n - s.length);
  }

  function fmtCoord(lat, lon) {
    const ns = lat >= 0 ? 'N' : 'S';
    const ew = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${ns}  ${Math.abs(lon).toFixed(2)}°${ew}`;
  }

  function renderCard(place, weather) {
    const [glyph, label] = WMO[weather.weather_code] || ['·', 'Unknown'];
    const lines = [
      '┌──────────────────────────────┐',
      `│  ${pad(place.name, 28)}│`,
      `│  ${pad(place.country || '', 28)}│`,
      '├──────────────────────────────┤',
      `│  ${glyph}  ${pad(label, 25)}│`,
      `│  ${pad(weather.temperature_2m + '°C', 28)}│`,
      `│  ${pad('Wind  ' + weather.wind_speed_10m + ' km/h', 28)}│`,
      `│  ${pad('RH    ' + weather.relative_humidity_2m + '%', 28)}│`,
      '├──────────────────────────────┤',
      `│  ${pad(fmtCoord(place.latitude, place.longitude), 28)}│`,
      '└──────────────────────────────┘',
    ];
    weatherEl.textContent = lines.join('\n');
  }

  async function geocode(name) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Geocoding failed');
    const data = await r.json();
    if (!data.results || data.results.length === 0) {
      throw new Error(`No place found for "${name}"`);
    }
    const hit = data.results[0];
    return {
      name: hit.name,
      country: hit.country || '',
      latitude: hit.latitude,
      longitude: hit.longitude,
    };
  }

  async function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('Weather lookup failed');
    const data = await r.json();
    if (!data.current) throw new Error('No current weather data');
    return data.current;
  }

  async function locate(name) {
    button.disabled = true;
    setStatus('Looking up ' + name + '…', false);
    try {
      const place = await geocode(name);
      const weather = await getWeather(place.latitude, place.longitude);
      window.AsciiGlobe.setPin(place.latitude, place.longitude);
      renderCard(place, weather);
      setStatus(`${place.name}${place.country ? ', ' + place.country : ''} — updated.`, false);
    } catch (e) {
      setStatus(e.message || 'Something went wrong.', true);
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = cityInput.value.trim();
    if (!v) return;
    locate(v);
  });

  // Boot
  window.AsciiGlobe.mount(globeEl);
  cityInput.value = 'Paris';
  locate('Paris');
})();
