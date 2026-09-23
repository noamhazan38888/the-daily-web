// Hide expired data if a reader leaves the page open for more than 15 minutes.
const weather = document.querySelector('[data-weather-expires]');
if (weather?.dataset.weatherExpires) {
  const expiresAt = Date.parse(weather.dataset.weatherExpires);
  const expireWeather = () => {
    if (Date.now() >= expiresAt) {
      weather.querySelector('[data-weather-content]').hidden = true;
      weather.querySelector('[data-weather-unavailable]').hidden = false;
    }
  };
  expireWeather();
  setTimeout(expireWeather, Math.max(0, expiresAt - Date.now()));
  document.addEventListener('visibilitychange', expireWeather);
}
