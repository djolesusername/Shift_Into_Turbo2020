const HttpError = require("../models/http-error");
const mongoose = require("mongoose");
const Truck = require("../models/truck");
const Driver = require("../models/driver");
const fetch = require("node-fetch");
const User = require("../models/user");
const driver = require("../models/driver");

const createDrivers = async () => {
  let ktdrivers;
  let ktdrivers2;
  let drivers;

  try {
    drivers = await Driver.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a driver",
      500
    );
    return next(error);
  }

  try {
    let targetUrl =
      "https://php.fs.rs/keeptruckin/?endpoint=available_time&per_page=100&page_no=1";

    let targetUrl2 =
      "https://php.fs.rs/keeptruckin/?endpoint=available_time&per_page=100&page_no=2";

    await fetch(targetUrl)
      .then((res) => res.json())
      .then((json1) => {
        ktdrivers = json1;
      });

    await fetch(targetUrl2)
      .then((res) => res.json())
      .then((json2) => {
        ktdrivers2 = json2;
      });
  } catch (err) {
    console.log(err);
  }

  let id;
  let name;
  let speeding;
  let legalSpeed;
  let lastUpdate;
  let cycle;
  let shift;
  let drive;
  let break30;

  for (let i = 0; i < ktdrivers.users.length; i++) {
    id = ktdrivers.users[i].user.id;

    let found = false;
    for (let j = 0; j < drivers.length; j++) {
      if (parseInt(id) == parseInt(drivers[j].id)) {
        j = drivers.length - 1;
        found = true;
      }
    }

    if (!found) {
      name =
        ktdrivers.users[i].user.first_name +
        " " +
        ktdrivers.users[i].user.last_name;
      id = ktdrivers.users[i].user.id;
      cycle = ktdrivers.users[i].user.available_time.cycle;
      shift = ktdrivers.users[i].user.available_time.shift;
      drive = ktdrivers.users[i].user.available_time.drive;
      break30 = ktdrivers.users[i].user.available_time.break;

      const createdDriver = new Driver({
        name,
        id,
        cycle,
        shift,
        drive,
        break30,
        speeding: 0,
        legalSpeed: 0,
      });
      found = true;

      try {
        console.log("creatin driver");
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdDriver.save({ session: sess });
        // Mongoose push
        // user.trucks.push(createdTruck);
        //await user.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        const error = new HttpError("Could not create driver", 500);
        console.log(err);
        //stop execution if we have an error
        return next(error);
      }
    }
  }
  //TODO fix duplicate code
  for (let i = 0; i < ktdrivers2.users.length; i++) {
    id = ktdrivers2.users[i].user.id;

    let found = false;
    for (let j = 0; j < drivers.length; j++) {
      if (parseInt(id) == parseInt(drivers[j].id)) {
        j = drivers.length - 1;
        found = true;
      }
    }

    if (!found) {
      name =
        ktdrivers2.users[i].user.first_name +
        " " +
        ktdrivers2.users[i].user.last_name;
      id = ktdrivers2.users[i].user.id;
      cycle = ktdrivers2.users[i].user.available_time.cycle;
      shift = ktdrivers2.users[i].user.available_time.shift;
      drive = ktdrivers2.users[i].user.available_time.drive;
      break30 = ktdrivers2.users[i].user.available_time.break;

      const createdDriver = new Driver({
        name,
        id,
        cycle,
        shift,
        drive,
        break30,
        speeding: 0,
        legalSpeed: 0,
      });
      found = true;

      try {
        console.log(createdDriver);
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdDriver.save({ session: sess });
        // Mongoose push
        // user.trucks.push(createdTruck);
        //await user.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        const error = new HttpError("Could not create driver", 500);
        console.log(err);
        //stop execution if we have an error
        return next(error);
      }
    }
  }
};

const getDrivers = async (req, res, next) => {
  let drivers;
  try {
    drivers = await Driver.find();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a driver",
      500
    );
    return next(error);
  }
  res.json({
    drivers: drivers.map((driver) => driver.toObject({ getters: true })),
  });
};

exports.createDrivers = createDrivers;
exports.getDrivers = getDrivers;
