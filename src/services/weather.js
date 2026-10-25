const CACHE_TTL = 10 * 60 * 1000;
const MAX_AGE = 15 * 60 * 1000;
let cachedWeather = null;
let fetchedAt = 0;
let pendingRequest = null;
let retryAt = 0;

function isFresh() {
  return cachedWeather && Date.now() - fetchedAt < MAX_AGE &&
    Date.now() - cachedWeather.observedAt < MAX_AGE;
}

async function fetchWeather() {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
    if (!apiKey) throw new Error('Weather API key is missing');

    const latitude = Number(process.env.WEATHER_LATITUDE ?? 32.0853);
    const longitude = Number(process.env.WEATHER_LONGITUDE ?? 34.7818);
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
      throw new Error('Invalid weather location');
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.search = new URLSearchParams({
      lat: String(latitude), lon: String(longitude), appid: apiKey,
      units: 'metric', lang: 'he'
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('Weather request failed');

    const data = await response.json();
    const condition = data.weather?.[0];
    const observedAt = Number.isFinite(data.dt) ? data.dt * 1000 : NaN;
    const now = Date.now();
    if (!Number.isFinite(data.main?.temp) || typeof condition?.description !== 'string' ||
        !condition.description.trim() || !Number.isFinite(observedAt) ||
        observedAt > now || now - observedAt >= MAX_AGE) {
      throw new Error('Weather data is missing or outdated');
    }

    fetchedAt = now;
    cachedWeather = {
      location: process.env.WEATHER_LOCATION_NAME || data.name || 'תל אביב',
      temperature: Math.round(data.main.temp),
      description: condition.description,
      icon: typeof condition.icon === 'string' && /^\d{2}[dn]$/.test(condition.icon)
        ? condition.icon : null,
      observedAt,
      fetchedAt
    };
    retryAt = 0;
    return cachedWeather;
  } catch {
    retryAt = Date.now() + 60 * 1000;
    return isFresh() ? cachedWeather : null;
  }
}

export async function getWeather() {
  // Share one request between visitors; never display data older than 15 minutes.
  if (isFresh() && Date.now() - fetchedAt < CACHE_TTL) return cachedWeather;
  if (Date.now() < retryAt) return isFresh() ? cachedWeather : null;
  if (!pendingRequest) {
    pendingRequest = fetchWeather().finally(() => { pendingRequest = null; });
  }
  return pendingRequest;
}
