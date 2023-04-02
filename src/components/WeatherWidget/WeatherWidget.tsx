import React, { useState, useEffect } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { geoApiOptions, GEO_API_URL, WEATHER_API_URL, WEATHER_API_KEY } from './api';
// import Search from './Search';
// import CurrentWeather from './CurrentWeather';


const WeatherWidget = () => {

  const [search, setSearch] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);

  const loadOptions = (inputValue) => {
    return fetch(
      `${GEO_API_URL}/cities?minPopulation=1000000&namePrefix=${inputValue}`,
      geoApiOptions
    )
      .then((response) => response.json())
      .then((response) => {

        return {
          options: response.data.map((city) => {
            return {
              value: `${city.latitude} ${city.longitude}`,
              label: `${city.name}, ${city.countryCode}`,
            };
          }),
        };
      });
  };

  const handleOnChange = (searchData) => {
    setSearch(searchData);
    handleOnSearchChange(searchData);

  };
 
  const handleOnSearchChange = (searchData) => {
    const [lat, lon] = searchData.value.split(" ");

    const currentWeatherFetch = fetch(
      `${WEATHER_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    Promise.all([currentWeatherFetch])
      .then(async (response) => {
        const weatherResponse = await response[0].json();


        setCurrentWeather({ city: searchData.label, ...weatherResponse });
        console.log(weatherResponse.weather[0].icon);
      })
      .catch(console.log);
  };

  
  
  

  const synonymsForExcellent = [
    'superb',
    'outstanding',
    'exceptional',
    'fantastic',
    'terrific',
    'great',
    'splendid',
    'marvelous',
    'wonderful',
    'brilliant',
    'superlative',
    'first-rate',
    'top-notch',
    'stellar',
    'amazing',
    'perfectly good',
    'completely adequate',
    'entirely acceptable',
    'absolutely suitable',
    'flawlessly fine',
    'utterly decent',
    'totally satisfactory',
    'entirely serviceable',
    'faultlessly sufficient',
    'perfectly acceptable',
    'fully functional',
    'megasuperb',
    'hyperoutstanding',
    'ultramagnificent',
    'terramegaawesome',
    'gigaepic',
    'titanictop-notch',
    'cosmostellar',
    'supramarvelous',
    'magnificently marvelous',
    'spectacularly splendid'
  ];

  const randomAdjective = `${synonymsForExcellent[Math.floor(Math.random() * synonymsForExcellent.length)]}`;

  return (
    <>

    <div className="container">
          <AsyncPaginate
            placeholder="In which city you want to study kanji ?"
            debounceTimeout={600}
            value={search}
            onChange={handleOnChange}
            loadOptions={loadOptions}
            />

    </div>

    {currentWeather && (
        <div className="weather-widget">
          <div className="weather">
            <div className="top">
              <div>
                <p className="city">{currentWeather.city}</p>
                <p className="weather-description">{currentWeather.weather[0].description}</p>
              </div>
              <img
                alt="weather"
                className="weather-icon"
                src={`icons/${currentWeather.weather[0].icon}.png`}
              />
              </div>
              <div className="bottom">
                <p className="temperature">{Math.round(currentWeather.main.temp)}°C</p>
                <div className="details">
                  <div className="parameter-row">
                    <span className="parameter-label">Details</span>
                  </div>

                  <div className="parameter-row">
                    <span className="parameter-label">Wind</span>
                    <span className="parameter-value">{currentWeather.wind.speed} m/s</span>
                  </div>
                </div>
              <h5>Fortunately, today's weather in {currentWeather.city} is {randomAdjective} for learning kanji ! Hooray !</h5>
            </div>
          </div>
        </div> 
    )}

    </>
  );
};

export default WeatherWidget;
