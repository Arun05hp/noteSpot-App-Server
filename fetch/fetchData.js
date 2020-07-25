const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const con = require("../mysql");

// api to get all posts
router.get("/data", (req, res) => {
  con.query("SELECT * FROM user", (err, result) => {
    if (err) {
      res.json({ err: err });
    } else {
      res.json(result);
    }
  });
});

router.post("/signup", (req, res) => {
  const data = req.body;
  const { name, email, password } = data;
  if (!email || !password || !name) {
    return res
      .status(422)
      .send({ error: "Must provide Name,Email and password" });
  }

  con.query(
    "SELECT COUNT(*) AS cnt FROM user WHERE email = ?",
    email,
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result[0].cnt > 0) {
        return res.send({ error: "Email already exists" });
      } else {
        con.query("INSERT INTO user SET ?", data, (err, result) => {
          if (err) {
            return res.status(422).json(err.message);
          } else {
            const token = jwt.sign(
              { userId: result.insertId },
              "User_Secret_Key"
            );
            return res.send({ token });
          }
        });
      }
    }
  );
});

module.exports = router;
