const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const driverSchema = new Schema({
  name: String,
  id: Number,
  speeding: Number,
  legalSpeed: Number,
  lastUpdate: Date,
  cycle: Number,
  shift: Number,
  drive: Number,
  break30: Number,
  speeding24: Number,
  legal24: Number,

  truck: { type: mongoose.Types.ObjectId, required: false, ref: "Truck" },
});

//model returns constructor functaion, first argument is name, second argument Schema
module.exports = mongoose.model("Driver", driverSchema);
