const jwt = require("jsonwebtoken");
const con = require("../mysql");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).send({ error: "You must be Logged in" });
  }
  const token = authorization.replace("NSApp ", "");

  jwt.verify(token, process.env["KEY_STRING"], async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "You must be logged in" });
    }

    next();
  });
};
