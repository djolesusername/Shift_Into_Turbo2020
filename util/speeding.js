const Httperror = require("../models/http-error");
const fetch = require("node-fetch");
const sendEmail = require("./mailer");
const mail24 = require("./mail24");

const Driver = require("../models/driver");
const mongoose = require("mongoose");

let speeding = {};
let speeding2 = {};
//clearing 24h scores
const clear24 = async () => {
  let drivers;
  let driverid;
  let driver;
  try {
    drivers = await Driver.find();
    mail24(drivers);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find a truck", 500);
    return next(error);
  }
  try {
    for (let i = 0; i < drivers.length; i++) {
      if (drivers[i].legal24 !== 0 || drivers[i].speeding24 !== 0) {
        driverid = drivers[i].id;
        console.log("in");
        driver = await Driver.findOne({ id: driverid });
        driver.speeding24 = 0;
        driver.legal24 = 0;
        await driver.save();
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const recordSpeeding = async (driverid) => {
  /* for (let i = 0; i> drivers.length; i++) {
    if (driverid === drivers[i].id) {
      drivers[i].speeding++
      i=drivers.length
    }
  }*/
  try {
    let driver = await Driver.findOne({ id: driverid });

    driver.speeding = driver.speeding + 1;
    driver.speeding24 = driver.speeding24 + 1 || 0;
    await driver.save();
  } catch (err) {
    console.log(err);
  }
};

const recordLegal = async (driverid) => {
  console.log("recordlegal");
  if (driverid) {
    try {
      let driver = await Driver.findOne({ id: driverid });
      driver.legalSpeed = driver.legalSpeed + 1;
      driver.legal24 = driver.legal24 + 1 || 0;
      await driver.save();
    } catch (err) {
      console.log(err);
    }
  }
};

function getSpeeding(ktdata) {
  console.log("Speeding in");
  let speedLimitTN = [
    "Farragut, TN",
    "Lenoir City, TN",
    "Arlington, TN",
    "Lakeland, TN",
    "Jefferson County, TN",
    "Loudon County, TN",
    "Memphis, TN",
    "Knoxville, TN",
    "Sevierville, TN",
    "Mecklenburg County, VA",
    "South Hill, VA",
    "Piperton, TN",
    "Fayette County, TN",
    "White Pine, TN",
    "Dandridge, TN",
    "Kingsport, TN",
    "Sullivan County, TN",
  ];

  let skipTrucks = [548393, 736, 857, 798, 886];

  for (let i = 0; i < ktdata.vehicles.length; i++) {
    // skipping trucks that are not active
    if (
      ktdata.vehicles[i].vehicle.current_location &&
      (skipTrucks.indexOf(Number(ktdata.vehicles[i].vehicle.number)) == -1 || ktdata.vehicles[i].vehicle.number.toString() === "0857")
    ) {
      // skipping truck that are not moving or moving slower than 20 mph
      //sending request for remaining trucks, injecting their location from ktdata
      //multiply by 2.3 to convert m/s to mph to get speedlimit
      if (parseInt(ktdata.vehicles[i].vehicle.current_location.speed) > 30) {
        fetch(
          `https://router.hereapi.com/v8/routes?apiKey=${process.env.HEREMAPS_API}&transportMode=truck&origin=${ktdata.vehicles[i].vehicle.current_location.lat},${ktdata.vehicles[i].vehicle.current_location.lon}&destination=39.4732285,-76.2349634&spans=speedLimit&return=polyline`
        )
          .then((blob) => blob.json())
          .then((jsondata) => {
            let speedlimit = parseInt(jsondata.routes[0].sections[0].spans[0].speedLimit) * 2.3;
            let speedlimitTofixed = speedlimit.toFixed(0);

            let locString = ktdata.vehicles[i].vehicle.current_location.description.toString();
            for (let p = 0; p < speedLimitTN.length; p++) {
              if (locString.match(speedLimitTN[p])) {
                console.log("tn match");
                speedlimit = 65;
                speedlimitTofixed = 65;
              }
            }
            //gethering all truck info if truck is over speedlimit
            if (speedlimit + 8 < parseInt(ktdata.vehicles[i].vehicle.current_location.speed)) {
              let located_at = ktdata.vehicles[i].vehicle.current_location.located_at.split("T")[1].split("-")[0];

              let located_atDate = ktdata.vehicles[i].vehicle.current_location.located_at.split("T")[0];
              let locDate = Date.parse(`${located_atDate}T${located_at}`);

              //checking if truck is already memoized for speeding and if so checking location dates to make sure that they are different before  sending email
              if (speeding2[ktdata.vehicles[i].vehicle.number] && speeding2[ktdata.vehicles[i].vehicle.number].locDate !== locDate) {
                let driverEmail;
                if (ktdata.vehicles[i].vehicle.current_driver.id) {
                  let driversid = ktdata.vehicles[i].vehicle.current_driver.id;
                  driverEmail = ktdata.vehicles[i].vehicle.current_driver.email;

                  recordSpeeding(driversid);
                }

                console.log("about to send email");
                sendEmail(
                  speeding[ktdata.vehicles[i].vehicle.number],
                  speeding2[ktdata.vehicles[i].vehicle.number],
                  ktdata.vehicles[i],
                  speedlimitTofixed,
                  driverEmail
                );
                delete speeding[ktdata.vehicles[i].vehicle.number];
                delete speeding2[ktdata.vehicles[i].vehicle.number];

                console.log("about to remove from object, sending email");
              } else if (speeding[ktdata.vehicles[i].vehicle.number] && speeding[ktdata.vehicles[i].vehicle.number].locDate !== locDate) {
                console.log("adding to speeding2");
                if (ktdata.vehicles[i].vehicle.current_driver.id) {
                  let driversid = ktdata.vehicles[i].vehicle.current_driver.id;
                  recordSpeeding(driversid);
                }
                speeding2[ktdata.vehicles[i].vehicle.number] = {
                  truck: ktdata.vehicles[i].vehicle.number,
                  speed: ktdata.vehicles[i].vehicle.current_location.speed,
                  speedL: speedlimitTofixed,
                  locationlat: ktdata.vehicles[i].vehicle.current_location.lat,
                  locationlng: ktdata.vehicles[i].vehicle.current_location.lon,
                  locatedat: ktdata.vehicles[i].vehicle.current_location.located_at,
                  locDate: locDate,
                  locDescription: ktdata.vehicles[i].vehicle.current_location.description.toString(),
                };
              }
              //if truck is memoized but information about it wasn't updated on keeptrukin truck is being skipped
              else if (speeding2[ktdata.vehicles[i].vehicle.number] && speeding2[ktdata.vehicles[i].vehicle.number].locDate == locDate) {
                console.log("same date sp2");
              } else if (speeding[ktdata.vehicles[i].vehicle.number] && speeding[ktdata.vehicles[i].vehicle.number].locDate == locDate) {
                console.log("same date sp" + speeding[ktdata.vehicles[i].vehicle.number]);
              }
              // if truck is not memoized  creating an object with information about speeding event
              else {
                console.log("adding to speeding");
                if (ktdata.vehicles[i].vehicle.current_driver) {
                  let driversid = ktdata.vehicles[i].vehicle.current_driver.id;
                  recordSpeeding(driversid);
                }
                speeding[ktdata.vehicles[i].vehicle.number] = {
                  truck: ktdata.vehicles[i].vehicle.number,
                  speed: ktdata.vehicles[i].vehicle.current_location.speed,
                  speedL: speedlimitTofixed,
                  locationlat: ktdata.vehicles[i].vehicle.current_location.lat,
                  locationlng: ktdata.vehicles[i].vehicle.current_location.lon,
                  locatedat: ktdata.vehicles[i].vehicle.current_location.located_at,
                  locDate: locDate,
                  locDescription: ktdata.vehicles[i].vehicle.current_location.description.toString(),
                };
              }

              /*if (speeding.length > 0 ) {
                                        for (let j = 0; j <= speeding.length; j++) {
                               
                               
                                            if (!(speeding[j].truck ==  ktdata.vehicles[i].vehicle.number && speeding[j].located_at == ktdata.vehicles[i].vehicle.current_location.located_at)) {
                                                 speeding.push({
                                                     truck: ktdata.vehicles[i].vehicle.number, 
                                                     speed: ktdata.vehicles[i].vehicle.current_location.speed, 
                                                     speedL: speedlimitTofixed, 
                                                     locationlat: ktdata.vehicles[i].vehicle.current_location.lat, 
                                                     locationlng: ktdata.vehicles[i].vehicle.current_location.lon, 
                                                     locatedat: ktdata.vehicles[i].vehicle.current_location.located_at
                                                                             })
                     
                                                                            
                                     
                                         } 
                                         else {
                                             sendEmail(speeding[j], ktdata.vehicles[i], speedlimitTofixed);
                                             speeding2 = speeding.filter(item => item !== speeding[j] ) 
                                             speeding = speeding2
                                         } 
                                     
                                  
                                     } 
                                   }
                             
*/
            }
            //if truck is memoized yet not over speedlimit its record gets removed. The goal is to catch consistent driving over the limit
            //and not occasional which can happen during overtaking.
            else if (speeding[ktdata.vehicles[i].vehicle.number]) {
              delete speeding[ktdata.vehicles[i].vehicle.number];
              delete speeding2[ktdata.vehicles[i].vehicle.number];
              if (!!ktdata.vehicles[i].vehicle.current_driver) {
                let driversid = ktdata.vehicles[i].vehicle.current_driver.id;
                recordLegal(driversid);
              }

              console.log("about to remove from object, not over limit");
            } else {
              if (ktdata.vehicles[i].vehicle.current_driver) {
                let driversid = ktdata.vehicles[i].vehicle.current_driver.id;
                recordLegal(driversid);
              }
            }
          });
      }
    }
  }

  console.log(speeding);
}
exports.clear24 = clear24;
exports.getSpeeding = getSpeeding;
