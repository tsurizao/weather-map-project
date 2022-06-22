"use strict";

import {OPEN_WEATHER_KEY} from "./keys.js";

const daysOfTheWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function windCardinalDirection(degrees) {
    let cardinalDirection = '';
    if ((degrees > 348.75 && degrees <= 360) || (degrees >= 0 && degrees <= 11.25)) {
        cardinalDirection = "N";
    } else if (degrees > 11.25 && degrees <= 33.75) {
        cardinalDirection = "NNE";
    } else if (degrees > 33.75 && degrees <= 56.25) {
        cardinalDirection = "NE";
    } else if (degrees > 56.25 && degrees <= 78.75) {
        cardinalDirection = "ENE";
    } else if (degrees > 78.75 && degrees <= 101.25) {
        cardinalDirection = "E";
    } else if (degrees > 101.25 && degrees <= 123.75) {
        cardinalDirection = "ESE";
    } else if (degrees > 123.75 && degrees <= 146.25) {
        cardinalDirection = "SE";
    } else if (degrees > 146.25 && degrees <= 168.75) {
        cardinalDirection = "SSE";
    } else if (degrees > 168.75 && degrees <= 191.25) {
        cardinalDirection = "S";
    } else if (degrees > 191.25 && degrees <= 213.75) {
        cardinalDirection = "SSW";
    } else if (degrees > 213.75 && degrees <= 236.25) {
        cardinalDirection = "SW";
    } else if (degrees > 236.25 && degrees <= 258.75) {
        cardinalDirection = "WSW";
    } else if (degrees > 258.75 && degrees <= 281.25) {
        cardinalDirection = "W";
    } else if (degrees > 281.25 && degrees <= 303.75) {
        cardinalDirection = "WNW";
    } else if (degrees > 303.75 && degrees <= 326.25) {
        cardinalDirection = "NW";
    } else if (degrees > 326.75 && degrees <= 348.75) {
        cardinalDirection = "NNW";
    }
    return cardinalDirection;
}

// Returns time information
function formatTime(timeStamp) {
    let dateTime = new Date(timeStamp * 1000);
    let year = dateTime.getFullYear();
    let month = months[dateTime.getMonth()];
    let day = dateTime.getDate();
    let hour = appendLeadingZeroes(dateTime.getHours());

    // Changes 24 hour format to 12 hour format, then adds an AM/PM
    function fixHour() {
        if (hour > 12) {
            hour -= 12;
            minutes += " PM";
        } else {
            minutes += " AM";
        }
    }

    let minutes = appendLeadingZeroes(dateTime.getMinutes());
    fixHour();
    return month + " " + day + " " + year + " " + hour + ":" + minutes;
}

// Gets the day of the week and returns it
function formatDay(timeStamp) {
    let dateTime = new Date(timeStamp * 1000);
    return daysOfTheWeek[dateTime.getDay()];
}

// Fixes the zeroes in formatTime()
function appendLeadingZeroes(n) {
    if (n <= 9) {
        return "0" + n;
    }
    return n;
}

// Map information
mapboxgl.accessToken = MAPBOX_API_TOKEN;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/outdoors-v11', // style URL
    center: [-98.4946, 29.4252], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

// Sets default marker location
let el = document.createElement("div");
el.className = "marker";
let marker = new mapboxgl.Marker(el, {
    anchor: "bottom",
})
    .setDraggable(true)
    .setLngLat([-98.4946, 29.4252])
    .addTo(map);

// Drag marker to get forecast, weather conditions at dropped location
marker.on("dragend", function () {
    getWeather();
});

// Clicking map to also updates location based weather information
map.on("click", function (e) {
    marker.setLngLat(e.lngLat);
    getWeather();
});

// Updates current weather and forecast based on pin location
function getWeather() {
    $.get("http://api.openweathermap.org/data/2.5/onecall", {
        APPID: OPEN_WEATHER_KEY,
        lat: marker.getLngLat().lat,
        lon: marker.getLngLat().lng,
        units: "imperial",
    }).done(function (data) {
        // Populate current conditions
        $("#current-day").html(`, ${formatTime(appendLeadingZeroes(data.current.dt))}`)
        $("#weather").html(data.current.weather[0].description);
        let iconCode = data.current.weather[0].icon;
        let iconUrl = `http://openweathermap.org/img/wn/${iconCode}@4x.png`;
        $("#weather-icon").attr('src', iconUrl);
        $("#temp").html(`${data.current.temp.toFixed(1)}°F`);
        $("#high-low").html(`Day ${data.daily[0].temp.max.toFixed(1)}° • Night ${data.daily[0].temp.min.toFixed(1)}°`);
        $("#humidity").html(`Humidity: ${data.current.humidity}%`);
        $("#wind").html(`Wind: ${data.current.wind_speed.toFixed(1)} mph ${windCardinalDirection(data.current.wind_deg)}`);
        $("#forecast").html("");

        // Populate 5-day forecast
        data.daily.forEach(function (day, index) {
            if (index < 5) {
                iconCode = day.weather[0].icon;
                iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
                $("#forecast").append(`
                    <div class='card forecast-card'>
                    <div class='d-flex row justify-content-center'>
                    <h5 class='d-flex justify-content-center'>${formatDay(appendLeadingZeroes(day.dt))}</h5>
                    <img src="${iconUrl}" style='width: 75px'>
                    <span class='d-flex justify-content-center'>${day.temp.max.toFixed(1)}° / ${day.temp.min.toFixed(1)}°</span>
                    <span class='d-flex justify-content-center'>Humidity: ${day.humidity}%</span>
                    <span class='d-flex justify-content-center'>Wind: ${day.wind_speed.toFixed(1)}</span>
                    </div>
                    </div>`
                );
            }
        });
    });
}

// Updates conditions and forecast based off of input value
function updateInformation() {
    if ($("#location").val().trim() === "") {
    } else {
        let city = $("#location").val();
        let coords = $("#location").val().trim().split(",").reverse();
        coords[0] = parseFloat(coords[0]);
        coords[1] = parseFloat(coords[1]);
        if (!isNaN(parseFloat(city))) {
            let coords = $("#location").val().trim().split(",").reverse();
            marker.setLngLat([coords[0], coords[1]])
                .addTo(map);
            map.jumpTo({center: coords, zoom: 9});
            getWeather();
        } else {
            $.get("http://api.openweathermap.org/data/2.5/weather", {
                APPID: OPEN_WEATHER_KEY,
                q: city,
                units: "imperial"
            }).done(function (data) {
                console.log(data.coord.lat);
                console.log(data.coord.lon);
                marker.setLngLat([data.coord.lon, data.coord.lat])
                    .addTo(map);
                map.jumpTo({center: data.coord, zoom: 9});
                getWeather();
            });
        }
    }
}

// Records coordinates, updates weather information and re-centers map
$("#location-button").on("click", function () {
    updateInformation();
    $("#location").value = "";
});
$("#location").on("keyup", function (e) {
    if (e.key === "Enter" || e.key === 13) {
        updateInformation();
        $("#location").value = "";
    }
});
getWeather();