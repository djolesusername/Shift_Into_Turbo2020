const Httperror = require("../models/http-error");
const fetch = require("node-fetch");
const e = require("express");

let timezone = null;
let timezoneMemo = {
  "LAS VEGAS, NV": "MST",
  "MIAMI, FL": "EST",
  "TAMPA, FL": "EST",
  "JACKSONVILLE, FL": "EST",
  "DALLAS, TX": "CST",
  "HOUSTON, TX": "CST",
  "IRVING, TX": "CST",
  "FARGO, ND": "CST",
  "FORT WORTH, TX": "CST",
  "BUTNER, NC": "EST",
  "WINDSOR, CT": "EST",
  "CARSON, CA": "PST",
};

async function getTimeZone(coordinates, destination) {
  console.log(destination);
  const destinationUp = destination.toUpperCase().trim();
  const countrycode = destinationUp.split(",")[1];
  const easternCountryCode = ["CT", "DE", "GA", "DC", "ME", "MD", "NH", "NJ", "NY", "NC", "OH", "PA", "SC", "VT", "VA", "WV"];
  const centralCountryCode = ["AL", "AR", "IL", "LA", "MN", "MS", "MO", "OK", "WI"];
  const mountainCountryCode = ["MT", "NM", "WY"];
  const pacificCountryCode = ["CA", "WA"];

  //first we will check memoized object, than checking based on state abbrevetaion, and if that doesn't work either sending the request
  if (timezoneMemo[destinationUp]) {
    timezone = timezoneMemo[destinationUp];
    console.log("no fetch");
  } else if (easternCountryCode.indexOf(countrycode) > -1) {
    timezone = "EST";

    console.log("no fetch");
  } else if (centralCountryCode.indexOf(countrycode) > -1) {
    timezone = "CST";

    console.log("no fetch");
  } else if (mountainCountryCode.indexOf(countrycode) > -1) {
    timezone = "MST";

    console.log("no fetch");
  } else if (pacificCountryCode.indexOf(countrycode) > -1) {
    timezone = "PST";

    console.log("no fetch");
  } else {
    console.log("about to fetch timezone");
    const response = await fetch(
      `http://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.TIMEZONE_DB}&format=json&by=position&lat=${coordinates.lat}&lng=${coordinates.lng}`
    )
      .then((response) => response.json())
      .then((json) => {
        timezone = json.abbreviation;
        console.log(timezone);
      });

    if (timezone === null) {
      console.log("Timezone not defined");
    }
  }
  return timezone;
}

module.exports = getTimeZone;
