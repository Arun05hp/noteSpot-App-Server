const express = require("express");
const con = require("../mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.post("/signup", (req, res) => {
  const data = req.body;
  const { email, password } = data;
  con.query(
    "SELECT COUNT(*) AS cnt FROM user WHERE email = ?",
    email,
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result[0].cnt > 0) {
        return res.send({ error: "Email already exists" });
      } else {
        bcrypt.genSalt(10, function (err, salt) {
          if (err) return res.status(500).send(err);
          bcrypt.hash(password, salt, function (err, hash) {
            if (err) return res.status(500).send(err);
            data.password = hash;
            con.query("INSERT INTO user SET ?", data, (err, result) => {
              if (err) {
                return res.status(422).json(err.message);
              } else {
                const token = jwt.sign(
                  { userId: result.insertId },
                  process.env["KEY_STRING"]
                );
                return res.send({ token, success: "Registered Successfully" });
              }
            });
          });
        });
      }
    }
  );
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  con.query("SELECT * FROM user WHERE email=?", email, async (err, result) => {
    if (err) return res.status(422).send(err.message);
    if (result.length > 0) {
      const match = await bcrypt.compare(password, result[0].password);
      if (match) {
        const token = jwt.sign(
          { userId: result[0].id },
          process.env["KEY_STRING"]
        );
        return res.send({ token, id: result[0].id });
      } else {
        return res.send({ error: "Email and password does not match" });
      }
    } else {
      return res.send({ error: " Email address doesn't exist" });
    }
  });
});

module.exports = router;
