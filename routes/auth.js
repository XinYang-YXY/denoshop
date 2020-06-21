const express = require("express");
const router = express.Router();
const moment = require("moment");

const alertMessage = require("../helpers/messenger");
const ensureAuthenticated = require("../helpers/auth");

// DB Table
const User = require("../models/User");
// DB Table
const bcrypt = require("bcryptjs"); // Salting
const passport = require("passport"); // For authentication

// Auth with Google, Get /auth/google
router.get('/google', passport.authenticate('google', {scope:['profile']}))

// Google callback
router.get("/google/callback", passport.authenticate('google', { failureRedirect: '/login'}), (req, res) => {
    res.redirect('/account')
})
module.exports = router;