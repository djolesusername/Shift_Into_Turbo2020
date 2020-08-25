const express = require("express");
const driversControllers = require("../controllers/drivers-controller");
const router = express.Router();

router.get("/", driversControllers.getDrivers);

module.exports = router;
