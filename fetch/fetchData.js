const express = require("express");
const router = express.Router();
const con = require("../mysql");

// api to get all posts
router.get("/", (req, res, next) => {
  con.query("SELECT * FROM user", (err, result) => {
    if (err) {
      res.json({ err: err });
    } else {
      res.json(result);
    }
  });
});

module.exports = router;
