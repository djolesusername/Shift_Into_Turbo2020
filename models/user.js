const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

//unique - speeding up the process of quering
//trucks to be edited from string to dynamic content
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String },
  trucks: [{ type: mongoose.Types.ObjectId, required: true, ref: "Truck" }],
});

//making sure that we cannot have same email multiple times
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
