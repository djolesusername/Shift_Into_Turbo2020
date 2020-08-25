const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "email name image");
  } catch (err) {
    const error = new HttpError("Fetching users failed", 500);
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  // Gettin errors object from validation and reacting to it if there are any errors
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please check your data", 422));
  }

  const { name, email, password } = req.body;
  let exsistingUser;
  try {
    exsistingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Signing up failed. ", 500);
    return next(error);
  }

  if (exsistingUser) {
    const error = new HttpError("user already exsists", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, please try again", 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: "http://mom.rs/wp-content/uploads/2016/10/test-logo.png",
    password: hashedPassword,
    trucks: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Sign up failed", 500);
    //stop execution if we have an error
    return next(error);
  }
  let token;
  try {
    token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, `${process.env.JWT_PASSPHRASE}`, { expiresIn: "1h" });
  } catch (err) {
    const error = new HttpError("Sign up failed", 500);
    //stop execution if we have an error
    return next(error);
  }
  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let exsistingUser;

  try {
    exsistingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login failed. ", 500);
    return next(error);
  }

  if (!exsistingUser) {
    const error = new HttpError("invalid credentials, could not log you in", 401);
    return next(error);
  }
  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, exsistingUser.password);
  } catch (err) {
    const error = new HttpError("Could not log you in, please check your credentials", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("invalid credentials, could not log you in", 403);
    return next(error);
  }
  //
  let token;
  try {
    token = jwt.sign({ userId: exsistingUser.id, email: exsistingUser.email }, `${process.env.JWT_PASSPHRASE}`, { expiresIn: "1h" });
  } catch (err) {
    const error = new HttpError("Logn failed", 500);
    //stop execution if we have an error
    return next(error);
  }

  res.json({
    userId: exsistingUser.id,
    email: exsistingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
