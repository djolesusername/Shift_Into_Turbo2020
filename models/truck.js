const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const truckSchema = new Schema({
  truckNumber: { type: Number, required: true },
  driver: String,
  driver2: String,
  destination: String,
  destinationCoordinates: {
    lat: Number,
    lng: Number,
  },
  destinationObj: [
    {
      email: String,
      targetDate: Number,
      loadNumber: String,
      destination: String,
      timezone: String,
      time: String,
      date: String,
    },
  ],

  timezone: String,
  locDate: String,
  located_atDate: String,
  located_at: String,
  speed: Number,
  location: String,
  eta: Date,
  updateString: String,
  onDutyDriver: String,
  aval_cycle: Number,
  aval_shift: Number,
  aval_drive: Number,
  aval_break: Number,
  aval_cycle2: Number,
  aval_shift2: Number,
  aval_drive2: Number,
  aval_break2: Number,
  aval_cycleOn: Number,
  aval_shiftOn: Number,
  aval_driveOn: Number,
  aval_breakOn: Number,
  notes: String,
  distance: Number,
  driverid: Number,
  driver2id: Number,
  driveridOn: Number,
  restartStart: Number,
  restartEnd: Number,
  restartEndString: String,
  cycleResetString: String,

  //creator references to another schema: User schema
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  drivers: [{ type: mongoose.Types.ObjectId, required: true, ref: "Driver" }],
});

//model returns constructor functaion, first argument is name, second argument Schema
module.exports = mongoose.model("Truck", truckSchema);
