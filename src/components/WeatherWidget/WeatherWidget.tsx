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

      })
      .catch(console.log);
  };

  useEffect(() => {
  console.log(currentWeather);
  }, [currentWeather])




  return (
    <>

    <div className="container">
          <AsyncPaginate
            placeholder="Search for city"
            debounceTimeout={600}
            value={search}
            onChange={handleOnChange}
            loadOptions={loadOptions}
            />

          {/* <Search onSearchChange={handleOnSearchChange} />
          {currentWeather && <CurrentWeather data={currentWeather} />} */}

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
            </div>
          </div>
        </div> 
    )}

    </>
  );
};

export default WeatherWidget;
