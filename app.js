const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoutes = require("./routes/user-routes");
const truckRoutes = require("./routes/truck-routes");
const driverRoutes = require("./routes/driver-routes.js");
const HttpError = require("./models/http-error");

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});
//Routes
app.use("/api/trucks", truckRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);

//only reached if previous req has no response
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  //sync
  throw error;
});

//4 params, Express error handling. Excecutes if any middleware in front of it yields an error
app.use((error, req, res, next) => {
  //Can send only one response, so checking that first
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

//First establish connection to db
//then start the server. Don't start the server if connection to db fails

mongoose
  .connect(`mongodb+srv://${process.env.MONGO_DB_CONNECTION}/trucksz?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(16386);
  })
  .catch((err) => {
    console.log(err);
  });
/*mongoose.once("open", () => {
  app.listen(16386, () => {
    console.log("Node server running on port 16386");
  });

  const taskCollection = db.collection("trucksz");
  const changeStream = taskCollection.watch();

  changeStream.on("change", (change) => {});
});
*/
//const changeStream = mongoose.Collection("trucks").watch();
//changeStream.on("change", (change) => console.log(change));

/*
app.listen(16386);
*/
