require("dotenv").config();
const User = require("../models/User"); // Load the user model

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const moment = require("moment");

const cloudinary = require("./cloudinaryConfig"); // Config object of cloudinary

module.exports = function (passport) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLECLIENTID,
				clientSecret: process.env.GOOGLECLIENTSECRET,
				callbackURL: "/auth/google/callback",
				proxy: true,
			},
			(accessToken, refreshToken, profile, done) => {
        console.log("Hello",profile.emails[0].value)
				try {
					User.findOne({ where: { googleId: profile.id } }).then(
						(user) => {
							if (user) {
								done(null, user);
							} else {
								cloudinary.uploader.upload(
									profile.photos[0].value,
									{
										tags: "basic_sample",
										folder:
											"/denoshop/userProfileImage/google",
									},
									function (err, image) {
										// Upload image to cloudinary + get the URL of processed image
										console.log();
										console.log("** File Upload");
										if (err) {
											console.warn(err);
										}
										console.log(
											"* public_id for the uploaded image is generated by Cloudinary's service."
										);
										console.log("* " + image.public_id);
										console.log("* " + image.url);

										let processedImage = cloudinary
											.image(image.public_id, {
												secure: true,
												transformation: [
													{
														width: 150,
														crop: "scale",
													},
												],
											})
											.replace("<img src='", "")
											.replace("' />", "");

										// Add to  the database
										// DateJoined
										// DateJoined
										let rawDate = new Date();
										let dateJoined = moment(
											rawDate,
											"DD/MM/YYYY"
										);
										const newUser = {
											googleId: profile.id,
											username: profile.displayName,
											imageFile: processedImage,
											dateJoined,
											email: profile.emails[0].value
										};

										User.create(newUser)
											.then((user) => {
												done(null, user);
											})
											.catch((err) => console.log(err));
									}
								);
							}
						}
					);
				} catch (err) {
					console.log(err);
				}
				// Add to  the database
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser((id, done) => {
		User.findById(id, (err, user) => done(err, user));
	});
};
