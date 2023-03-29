import React, { useState, useEffect } from 'react';

interface WeatherWidgetProps {}

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = () => {
  const [location, setLocation] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData>();

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(event.target.value);
  };

  const handleLocationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (location) {
      // fetch weather data using API
      fetch(`https://api.open-meteo.com/v1/forecast?city=${location}`)
        .then(response => response.json())
        .then(data => {
          const weather: WeatherData = {
            temperature: data.data[0].temperature,
            description: data.data[0].weather.description,
            icon: `https://open-meteo.com/img/icons/${data.data[0].weather.icon}.svg`,
          };
          setWeatherData(weather);
        });
    }
  };

  useEffect(() => {
    if (location) {
      // fetch weather data using API
      fetch(`https://api.open-meteo.com/v1/forecast?city=${location}`)
        .then(response => response.json())
        .then(data => {
          const weather: WeatherData = {
            temperature: data.data[0].temperature,
            description: data.data[0].weather.description,
            icon: `https://open-meteo.com/img/icons/${data.data[0].weather.icon}.svg`,
          };
          setWeatherData(weather);
        });
    }
  }, [location]);

  if (!location) {
    return (
      <form onSubmit={handleLocationSubmit}>
        <input type="text" placeholder="Enter location" onChange={handleLocationChange} />
        <button type="submit">Submit</button>
      </form>
    );
  }

  if (!weatherData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="weather-widget">
      <div className="weather-icon">
        <img src={weatherData.icon} alt={weatherData.description} />
      </div>
      <div className="weather-info">
        <div className="temperature">{weatherData.temperature}°C</div>
        <div className="description">{weatherData.description}</div>
        <div className="location">{location}</div>
      </div>
      <form onSubmit={handleLocationSubmit}>
        <input type="text" placeholder="Enter location" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default WeatherWidget;
