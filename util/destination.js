const Httperror = require("../models/http-error");
const fetch = require("node-fetch");

let coordinates;
async function getCoordsForAddress(destination) {
  await fetch(`http://www.mapquestapi.com/geocoding/v1/address?key=${process.env.MAPQUEST_API_KEY}&location=${destination}`)
    .then((response) => response.json())
    .then((json) => {
      coordinates = json.results[0].locations[0].latLng;
    });

  if (!coordinates) {
    const error = new Httperror("Could not find specified address", 422);
    // throwing error here will means that promise that wraps this into function will throw same error
    throw error;
  }

  return coordinates;
}

module.exports = getCoordsForAddress;
