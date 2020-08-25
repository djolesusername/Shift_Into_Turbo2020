const express = require("express");
const { check } = require("express-validator");

const trucksControllers = require("../controllers/trucks-controller");
const checkAuth = require("../middleware/check-auth");
const router = express.Router();

router.get("/:pid", trucksControllers.getTruckById);

router.get("/user/:uid", trucksControllers.getTrucksByUserId);

router.use(checkAuth);
//validation with express-validation. Needs to be registered in controller
router.post(
  "/dest/:pid",
  [check("destination").not().isEmpty()],
  trucksControllers.addDestination
);

router.post(
  "/",
  [check("truckNumber").not().isEmpty()],
  trucksControllers.createTruck
);

router.patch(
  "/:pid",
  [[check("destination").not().isEmpty()]],
  trucksControllers.updateTruck
);

router.delete("/:pid", trucksControllers.deleteTruck);

module.exports = router;
