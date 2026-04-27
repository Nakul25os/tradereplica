const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { buildWalletSnapshot } = require("./wallet");

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const sanitizeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  verified: user.verified,
  favorites: user.favorites || [],
  copiedPortfolios: user.copiedPortfolios || [],
  wallet: buildWalletSnapshot(user.wallet),
});

module.exports = {
  signToken,
  sanitizeUser,
};
