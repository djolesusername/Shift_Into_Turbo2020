const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();
router.get("/", usersController.getUsers);

router.post(
  "/signup",
  [check("name").not().isEmpty(), check("email").normalizeEmail().isEmail(), check("password").isLength({ min: 6 })],
  usersController.signup
);

router.post("/login", usersController.login);

//router.patch("/:pid", trucksControllers.updateTruck);

//router.delete("/:pid", trucksControllers.deleteTruck);

module.exports = router;
