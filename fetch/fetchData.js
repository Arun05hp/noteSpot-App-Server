const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const con = require("../mysql");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
}).single("imageData");

// api to get all posts
router.get("/data", (req, res) => {
  con.query("SELECT name FROM user", (err, result) => {
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
    return res.send({ error: "Must provide Name, Email and password" });
  }

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
                  "User_Secret_Key"
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
  if (!email || !password) {
    return res.send({ error: "Must provide  Email and password" });
  }
  con.query("SELECT * FROM user WHERE email=?", email, async (err, result) => {
    if (err) return res.status(422).send(err.message);
    if (result.length > 0) {
      const match = await bcrypt.compare(password, result[0].password);
      if (match) {
        const token = jwt.sign({ userId: result[0].id }, "User_Secret_Key");
        return res.send({ token, id: result[0].id });
      } else {
        return res.send({ error: "Email and password does not match" });
      }
    } else {
      return res.send({ error: " Email address doesn't exist" });
    }
  });
});

router.post("/profile", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.send({ error: "Not Found" });
  }
  con.query(
    "SELECT id,name,email,mobileno,profileImg FROM user WHERE id=?",
    userId,
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.length > 0) {
        return res.send(result[0]);
      } else {
        return res.send({ error: "User Not Found" });
      }
    }
  );
});

router.post("/imgupload", (req, res) => {
  upload(req, res, (err) => {
    const id = req.body.id;
    if (err instanceof multer.MulterError) {
      return res.send({ error: "File Too Large" });
    } else if (err) {
      return res.send({ error: "Something Went Wrong" });
    }
    con.query(
      "UPDATE user SET profileImg =? WHERE id= ?",
      [req.file.path, id],
      (err, result) => {
        if (err) return res.status(422).send(err.message);
        if (result.affectedRows != 0) {
          return res.send({ success: "Image Uploaded Successfully" });
        } else {
          return res.send({ error: "Failed to Upload" });
        }
      }
    );
  });
});

module.exports = router;
