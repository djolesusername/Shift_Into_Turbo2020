const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Truck = require("../models/truck");
const Driver = require("../models/driver");
const getCoordsForAddress = require("../util/destination");
const getTimeZone = require("../util/timezone");
let getSpeeding = require("../util/speeding");

const fetch = require("node-fetch");
const User = require("../models/user");
const truck = require("../models/truck");
//const driverControllers = require("./drivers-controller");

/*Fetching data from keeptruckin and fetching data from DB. Data fetched from DB will go thorough timezone check up. 
Once all data is fetched going through eta calc function to calculate estimated arrival time based on
- current location fetched from keeptruckin
- destination and timezone fetched from database
- distance fetched from hereapi 
*/
//driverControllers.createDrivers();

const fetchKT = async () => {
  let trucks;
  let ktdata;
  let ktdata2;
  let ktdrivers;
  let ktdrivers2;
  try {
    trucks = await Truck.find();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find a truck", 500);
    return next(error);
  }

  /* try {
    drivers = await Driver.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a driver",
      500
    );
    return next(error);
  }*/
  try {
    //var proxyUrl = "https://safe-shore-64373.herokuapp.com/";
    let targetUrl = "https://php.fs.rs/keeptruckin/?endpoint=available_time&per_page=100&page_no=1";
    let targetUrl2 = "https://php.fs.rs/keeptruckin/?endpoint=available_time&per_page=100&page_no=2";
    let targetUrl3 = "https://php.fs.rs/keeptruckin/?endpoint=vehicle_locations&per_page=75&page_no=1";
    let targetUrl4 = "https://php.fs.rs/keeptruckin/?endpoint=vehicle_locations&per_page=75&page_no=2";

    /*await fetch(targetUrl)
      .then((res) => res.json())
      .then((json1) => {
        ktdrivers = json1;
      });
    await fetch(targetUrl2)
      .then((res) => res.json())
      .then((json2) => {
        ktdrivers2 = json2;
      });
      */
    await fetch(targetUrl3)
      .then((res) => res.json())
      .then((json) => {
        ktdata = json;
      });
    await fetch(targetUrl4)
      .then((res) => res.json())
      .then((json) => {
        ktdata2 = json;
      });
    await etacalc(trucks, ktdata2);
    await etacalc(trucks, ktdata);
    // getSpeeding.getSpeeding(ktdata);
    // getSpeeding.getSpeeding(ktdata2);

    /*
      .then(() => {
        //   etacalc(trucks, ktdata, ktdrivers.users, ktdrivers2.users);
        etacalc(trucks, ktdata);
        // getSpeeding.getSpeeding(ktdata, ktdrivers.users, ktdrivers2.users);
      });
      .then(() => {
        // getSpeeding.getSpeeding(ktdata2, ktdrivers.users, ktdrivers2.users);
        etacalc(trucks, ktdata2);

      }); */
  } catch (err) {}
};

const etacalc = async (trucks, ktdata, ktdrivers, ktdrivers2) => {
  console.log("eta calc");

  for (let i = 0; i < trucks.length; i++) {
    for (let j = 0; j < ktdata.vehicles.length; j++) {
      if (Number(ktdata.vehicles[j].vehicle.number) == Number(trucks[i].truckNumber)) {
        let distanceR;
        let movSpeed;
        let curLocation;
        let located_at;
        let truck;
        let driveridOn = trucks[i].driverid;
        let onDutyDriver;
        let aval_time;
        let aval_cycleOn;
        let aval_shiftOn;
        let aval_driveOn;
        let aval_breakOn;
        let aval_cycle;
        let aval_shift;
        let aval_drive;
        let restartStart;
        let aval_break;
        let restartDate;
        let restartEndString;
        let cycleResetString;
        console.log(trucks[i].truckNumber);
        //starting with checking if device is active by checking if it has location. If so, grabbing the data
        if (!!ktdata.vehicles[j].vehicle.current_location.lat) {
          let originlat = ktdata.vehicles[j].vehicle.current_location.lat;
          let originlng = ktdata.vehicles[j].vehicle.current_location.lon;
          movSpeed = ktdata.vehicles[j].vehicle.current_location.speed;
          located_at = ktdata.vehicles[j].vehicle.current_location.located_at.split("T")[1].split("-")[0];
          curLocation = ktdata.vehicles[j].vehicle.current_location.description;

          let located_atDate = ktdata.vehicles[j].vehicle.current_location.located_at.split("T")[0];
          let locDate = Date.parse(`${located_atDate}T${located_at}`);
          //driver info block starting
          // if there is no driver assigned removing onduty data and setting data based on id
          //also fetching next restart
          if (!ktdata.vehicles[j].vehicle.current_driver) {
            driveridOn = 0;
            onDutyDriver = "";
            aval_cycleOn = 0;
            aval_shiftOn = 0;
            aval_driveOn = 0;
            aval_breakOn = 0;
            try {
              driverid = trucks[i].driverid;
              if (driverid) {
                await fetch(`https://php.fs.rs/keeptruckin/?endpoint=available_time&driver_ids=${driverid}`)
                  .then((res) => res.json())
                  .then((json1) => {
                    aval_cycle = json1.users[0].user.available_time.cycle;
                    aval_shift = json1.users[0].user.available_time.shift;
                    aval_drive = json1.users[0].user.available_time.drive;
                    aval_break = json1.users[0].user.available_time.break;

                    // console.log(json1.users[0].user.available_time);
                  });

                if (aval_shift < 39599) {
                  await fetch(`https://php.fs.rs/keeptruckin/?endpoint=logs&driver_ids=${driverid}&per_page=25&page_no=1`)
                    .then((res) => res.json())
                    .then((json) => {
                      let eventStart;
                      let brokenSleeper = false;

                      for (let x = json.logs[0].log.events.length - 1; x > 0; x--) {
                        if (json.logs[0].log.events[x].event.type === "off_duty" || json.logs[0].log.events[x].event.type === "sleeper") {
                          eventStart = json.logs[0].log.events[x].event.start_time;
                        } else {
                          x = 0;
                          brokenSleeper = true;
                          restartStart = Date.parse(eventStart);
                        }
                      }

                      if (!brokenSleeper) {
                        for (let x = json.logs[1].log.events.length - 1; x > 0; x--) {
                          if (json.logs[1].log.events[x].event.type === "off_duty" || json.logs[1].log.events[x].event.type === "sleeper") {
                            eventStart = json.logs[1].log.events[x].event.start_time;
                          } else {
                            x = 0;
                            brokenSleeper = true;
                            restartStart = Date.parse(eventStart);
                          }
                        }
                      }
                      if (!brokenSleeper && aval_cycle < 251000) {
                        for (let x = json.logs[2].log.events.length - 1; x > 0; x--) {
                          if (json.logs[2].log.events[x].event.type === "off_duty" || json.logs[2].log.events[x].event.type === "sleeper") {
                            eventStart = json.logs[2].log.events[x].event.start_time;
                          } else {
                            x = 0;
                            brokenSleeper = true;
                            restartStart = Date.parse(eventStart);
                          }
                        }
                      }
                    });
                }
              }
            } catch (err) {
              console.log(err);
            }

            //  for (let m = 0; m < ktdrivers.length; m++) {}
          }

          if (!!ktdata.vehicles[j].vehicle.current_driver) {
            driveridOn = ktdata.vehicles[j].vehicle.current_driver.id;
            onDutyDriver = ktdata.vehicles[j].vehicle.current_driver.first_name + " " + ktdata.vehicles[j].vehicle.current_driver.last_name;
            await fetch(`https://php.fs.rs/keeptruckin/?endpoint=available_time&driver_ids=${driveridOn}`)
              .then((res) => res.json())
              .then((json1) => {
                aval_cycleOn = json1.users[0].user.available_time.cycle;
                aval_shiftOn = json1.users[0].user.available_time.shift;
                aval_driveOn = json1.users[0].user.available_time.drive;
                aval_breakOn = json1.users[0].user.available_time.break;

                let duty_status = json1.users[0].user.duty_status;
                if (duty_status == "on_duty" || duty_status == "driving") {
                  console.log("line267");
                  restartStart = 0;
                  restartEndString = "onduty";
                  cycleResetString = "onduty";
                }

                // console.log(json1.users[0].user.available_time);
              });
          }

          //driver info block ending *

          try {
            let targetUrl = `https://route.ls.hereapi.com/routing/7.2/calculateroute.json?apiKey=${process.env.HERE_API}&waypoint0=geo!${originlat},${originlng}&waypoint1=geo!${trucks[i].destinationCoordinates.lat},${trucks[i].destinationCoordinates.lng}&mode=fastest;car;traffic:disabled`;
            await fetch(targetUrl)
              .then((res) => res.json())
              .then((json) => {
                distanceR = json.response.route[0].summary.distance;
              });
          } catch (err) {
            console.log(err);
          }

          const truckId = trucks[i]._id;
          const { destinationCoordinates, timezone } = trucks[i];

          try {
            truck = await Truck.findById(truckId);
          } catch (err) {
            const error = new HttpError("Something went wrong, could not find a truck", 500);
            return next(error);
          }
          let etaNumber = parseInt(locDate) + ((distanceR * 0.00062) / 54) * 1000 * 60 * 60;
          let hoursNeeded = Math.floor((distanceR * 0.00062) / 63);

          if (ktdata.vehicles[j].vehicle.current_driver) {
            if (
              (hoursNeeded > aval_driveOn / 3600 || hoursNeeded > aval_shiftOn / 3600) &&
              (!trucks[i].driver2 || trucks[i].driver2.toUpperCase() === "SOLO")
            ) {
              let multiplier = 1 + Math.floor((hoursNeeded - aval_driveOn / 3600) / 11);
              etaNumber = etaNumber + multiplier * 36000000;
            }
          }
          if (timezone === "EDT" || timezone === "EST") {
            etaNumber += 3600000;
          } else if (timezone === "MDT" || timezone === "MST") {
            etaNumber -= 3600000;
          } else if (timezone === "PDT" || timezone === "PST") {
            etaNumber -= 7200000;
          }

          const getUpdateString = (timeNum, timezone1) => {
            let month = (1 + timeNum.getMonth()).toString();
            month = month.length > 1 ? month : "0" + month;

            let day = timeNum.getDate().toString();
            day = day.length > 1 ? day : "0" + day;

            const solutionTime = timeNum.toTimeString("en-US").split(" ")[0];

            return `${solutionTime} ${timezone1} ${month}/${day} `;
          };
          let restartEnd = 0;

          if (restartStart > 0) {
            restartEnd = restartStart + 5 * 60 * 60 * 1000;
            restartDate = new Date(restartEnd);

            cycleReset = restartStart + 29 * 60 * 60 * 1000;
            cycleResetDate = new Date(cycleReset);

            restartEndString = getUpdateString(restartDate, "CT");
            cycleResetString = getUpdateString(cycleResetDate, "CT");
          }

          let eta = new Date(etaNumber);
          let updateString = getUpdateString(eta, timezone);
          truck.location = curLocation;
          truck.locDate = locDate;
          truck.located_atDate = located_atDate;
          truck.located_at = located_at;
          truck.distance = Math.floor(distanceR * 0.00062);
          truck.speed = movSpeed;
          truck.eta = eta;
          truck.updateString = updateString;
          //truck.driverid = driverid;
          truck.onDutyDriver = onDutyDriver;
          truck.aval_cycleOn = aval_cycleOn;
          truck.aval_shiftOn = aval_shiftOn;
          truck.aval_driveOn = aval_driveOn;
          truck.aval_breakOn = aval_breakOn;
          truck.aval_cycle = aval_cycle;
          truck.aval_shift = aval_shift;
          truck.aval_drive = aval_drive;
          truck.aval_break = aval_break;

          if (restartEndString) {
            truck.restartEndString = restartEndString;
          }

          if (cycleResetString) {
            truck.cycleResetString = cycleResetString;
          }
          if (restartStart) {
            truck.restartStart = restartStart;
          }
          if (restartEnd) {
            truck.restartEnd = restartEnd;
          }

          if (restartEnd < Date.now()) {
            console.log("lini393");
            restartEndString = "completed";
            truck.restartEndString = restartEndString;
          }

          /* if (cycleReset < Date.now()) {
            cycleResetString = "completed"
            truck.cycleResetString = cycleResetString;
          }
*/
          //TODO timezone list
          if (Date.now() - locDate > 30000000) {
            truck.updateString = "Location not updated";
          }
          try {
            await truck.save();
          } catch (err) {
            console.log(err);
            const error = new HttpError("Something went wrong, could not update truck", 500);
            return next(error);
          }
        }
      }
    }
  }
};

fetchKT();
setInterval(fetchKT, 270000);
setInterval(getSpeeding.clear24, 86340000);
const getTruckById = async (req, res, next) => {
  const truckId = req.params.pid;
  let truck;
  //static method, used on the model. Does not return a promise   .exec not used
  try {
    truck = await Truck.findById(truckId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find a truck", 500);
    return next(error);
  }

  if (!truck) {
    const error = new HttpError("Could not find a truck for the proivded ID", 404);
    return next(error);
  }
  //Converting to JS object and using getters to convert ID to string, therefore getting rid of underscore in id
  res.json({ truck: truck.toObject({ getters: true }) });
};

const getTrucksByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let trucks;

  /*
let userWithTrucks
try{
  userWithTrucks = await User.findById(userId).populate('trucks')
}
*/
  try {
    //Mongoose find returns aray and not a cursor
    trucks = await Truck.find({ creator: userId });
  } catch (err) {
    const error = new HttpError("Fetching trucks failed", 500);
    return next(error);
  }

  /*
if (!userWithTrucks || userWithTrucks.trucks.length === 0) {
    return next(
      new HttpError("Could not find a truck for the proivded userID", 404)
    );
  }
*/
  if (!trucks || trucks.length === 0) {
    return next(new HttpError("Could not find a truck for the proivded userID", 404));
  }
  // userWithTrucks.trucks.map...
  res.json({
    trucks: trucks.map((truck) => truck.toObject({ getters: true })),
  });
};

const createTruck = async (req, res, next) => {
  // Gettin errors object from validation and reacting to it if there are any errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  //since we are in async await, using try catch for error handling
  let coordinates;
  let timezone;
  //const { truckNumber, destination, driver, driver2, creator } = req.body;
  console.log(req.body);
  const truckNumber = req.body.truckNumber.value;
  let destination = req.body.destination.value;
  const driver = req.body.driver.value;
  const driver2 = req.body.driver2.value;
  const date = req.body.date.value;
  const timehs = req.body.time.value;
  const targetDate = Date.parse(`${date}T${timehs}`);
  const notes = req.body.notes.value;
  const driverid = req.body.driverid.value;
  //fixing California / Canada mix up by forcing full name instead of abbriavation
  if (destination.endsWith(", CA") || destination.endsWith(",CA")) {
    destination = destination.replace(/, CA|,CA/gi, ", California");
  }

  // fetching driverid
  //for (let p = 0; p < ktdrivers.length; p++) {}

  //const creator = req.body.creator;
  try {
    coordinates = await getCoordsForAddress(destination);
  } catch (error) {
    return next(error);
  }

  try {
    timezone = await getTimeZone(coordinates, destination);
  } catch (error) {
    return next(error);
  }
  const destinationObj = [
    {
      destination: req.body.destination.value,
      targetDate,
      loadNumber: req.body.loadNumber.value,
      email: req.body.email.value,
      date,
      time: timehs,
      timezone,
      coordinates,
    },
  ];

  const createdTruck = new Truck({
    truckNumber,
    driver,
    driver2,
    destination,
    destinationCoordinates: coordinates,
    creator: req.userData.userId,
    timezone,
    destinationObj,
    notes,
    driverid,
  });

  //checking user
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creating truck failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user with provided id", 404);
    return next(error);
  }

  // .save is async - saving to db
  // make sure to check mongo db collections and verify that collection trucks / trucks already exsists since this code doesn't do it
  try {
    console.log(createdTruck);
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdTruck.save({ session: sess });
    // Mongoose push
    user.trucks.push(createdTruck);
    await user.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Could not create truck", 500);
    console.log(err);
    //stop execution if we have an error
    return next(error);
  }
  fetchKT();

  res.status(201).json({ truck: createdTruck });
};

const updateTruck = async (req, res, next) => {
  // Gettin errors object from validation and reacting to it if there are any errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);

    return next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { truckNumber, destination, driver, driver2, notes, driverid } = req.body;
  const truckId = req.params.pid;
  let truck;
  //static method, used on the model. Does not return a promise   .exec not used
  try {
    truck = await Truck.findById(truckId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not find a truck", 500);
    return next(error);
  }

  /*if (truck.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not authorized", 401);
    return next(error);
  }*/
  console.log(truck.driver);
  truck.truckNumber = truckNumber;
  truck.driver = driver;
  truck.driver2 = driver2;
  truck.notes = notes;
  truck.driverid = driverid;

  try {
    if (truck.destination !== req.body.destinaton) {
      let coordinates;
      try {
        coordinates = await getCoordsForAddress(destination);
      } catch (error) {
        return next(error);
      }

      let timezone;
      try {
        timezone = await getTimeZone(coordinates, destination);
        truck.timezone = timezone;
        truck.destination = destination;
        truck.destinationCoordinates = coordinates;
        truck.updateString = "awaiting update";
        // using this value to indicate that we are awaiting update
        truck.distance = -5;
      } catch (error) {
        return next(error);
      }
    }

    await truck.save();
    fetchKT();

    /*  pusher.trigger("trucks", "truck", {
      truckNumber: truck.truckNumber,
      driver: truck.driver,
      driver2: truck.driver2,
      destination: truck.destination,
      destinationCoordinates: truck.destinationCoordinates,
      creator: truck.creator,
    }); */
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update truck", 500);
    return next(error);
  }
  res.status(200).json({ truck: truck.toObject({ getters: true }) });
};

const deleteTruck = async (req, res, next) => {
  const truckId = req.params.pid;
  let truck;
  try {
    // reffer to a document stored in different document and work with it. Relation between docs is necessery with refs.
    // It needs info on document and property that are being changed
    truck = await Truck.findById(truckId).populate("creator");
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete truck", 500);
    return next(error);
  }

  if (!truck) {
    const error = new HttpError("Could not find truck for this ID", 404);
    return next(error);
  }

  if (truck.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not authorized", 401);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await truck.remove({ session: sess });
    truck.creator.trucks.pull(truck);
    await truck.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete truck2", 500);
    return next(error);
  }

  res.status(200).json({ message: "Deleted truck" });
};
const addDestination = async (req, res, next) => {
  const truckId = req.params.pid;
  let truck;
  const destination = req.body.destination.value;
  const timehs = req.body.time.value;
  const date = req.body.date.value;

  try {
    truck = await Truck.findById(truckId);
  } catch (err) {
    console.log("truck not found add destination");

    const error = new HttpError("Something went wrong, could not find a truck", 500);
    return next(error);
  }

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(destination);
  } catch (error) {
    return next(error);
  }

  let timezone;
  try {
    timezone = await getTimeZone(coordinates, destination);
    // truck.timezone = timezone;
    //truck.destination = destination;
    // truck.destinationCoordinates = coordinates;
    // truck.updateString = "awaiting update";
    // using this value to indicate that we are awaiting update
    truck.distance = -5;
  } catch (error) {
    return next(error);
  }

  const targetDate = Date.parse(`${date}T${timehs}`);
  destinationObj2 = {
    destination: req.body.destination.value,
    targetDate,
    loadNumber: req.body.loadNumber.value,
    email: req.body.email.value,
    date: req.body.date.value,
    time: req.body.time.value,
    timezone,
  };
  truck.destinationObj.push(destinationObj2);
  try {
    await truck.save();
    fetchKT();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update truck", 500);
    return next(error);
  }
  res.status(200).json({ truck: truck.toObject({ getters: true }) });
};

exports.getTruckById = getTruckById;
exports.getTrucksByUserId = getTrucksByUserId;
exports.createTruck = createTruck;
exports.updateTruck = updateTruck;
exports.deleteTruck = deleteTruck;
exports.addDestination = addDestination;
