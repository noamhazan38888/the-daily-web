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

function weatherDescription(code) {
  if (code === 0) return 'בהיר';
  if (code >= 1 && code <= 3) return 'מעונן חלקית עד מעונן';
  if ([45, 48].includes(code)) return 'ערפל';
  if (code >= 51 && code <= 67) return 'טפטוף או גשם';
  if (code >= 71 && code <= 77) return 'שלג';
  if (code >= 80 && code <= 82) return 'ממטרים';
  if ([85, 86].includes(code)) return 'ממטרי שלג';
  if (code >= 95) return 'סופות רעמים';
  return 'מזג אוויר משתנה';
}

async function fetchWeather() {
  try {
    const latitude = Number(process.env.WEATHER_LATITUDE ?? 32.0853);
    const longitude = Number(process.env.WEATHER_LONGITUDE ?? 34.7818);
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
      throw new Error('Invalid weather location');
    }
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude, longitude,
      current: 'temperature_2m,weather_code', timeformat: 'unixtime' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error('Weather request failed');
    const { current } = await response.json();
    const observedAt = typeof current?.time === 'number' ? current.time * 1000 : NaN;
    if (!Number.isFinite(current?.temperature_2m) || !Number.isFinite(current?.weather_code) ||
        !Number.isFinite(observedAt) || observedAt > Date.now() || Date.now() - observedAt >= MAX_AGE) {
      throw new Error('Weather data is missing or outdated');
    }
    fetchedAt = Date.now();
    cachedWeather = {
      location: process.env.WEATHER_LOCATION_NAME ?? 'תל אביב',
      temperature: Math.round(current.temperature_2m),
      description: weatherDescription(current.weather_code), observedAt, fetchedAt
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
