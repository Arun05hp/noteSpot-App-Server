const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const con = require("../mysql");
const multer = require("multer");
const fs = require("fs");

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

const pdfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./pdf/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const uploadPdf = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("pdfData");

const bookStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./books/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const uploadSellerBook = multer({
  storage: bookStorage,
  limits: {
    fileSize: 1024 * 1024 * 2,
  },
}).single("imgData");

// api to get all posts
router.get("/data", (req, res) => {
  con.query(
    "SELECT bookRecords.id,sellerId,bookName,authorName,publisherName,description,price,bookImgLink,buyerId,sellerStatus,buyerStatus,collegeName,regNo,branch,hostelAddress FROM bookRecords LEFT JOIN collegeData ON bookRecords.sellerId = collegeData.userId",

    (err, result) => {
      if (err) {
        res.json({ err: err });
      } else {
        res.json(result);
      }
    }
  );
});

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
                console.log(err);
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
    "SELECT id,name,email,mobileno,profileImg,address FROM user WHERE id=?",
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

router.get("/getPdfs", (req, res) => {
  con.query("SELECT * FROM pdfData", (err, result) => {
    if (err) return res.status(422).send(err.message);
    if (result.length > 0) {
      return res.send(result);
    } else {
      return res.send({ error: "No pdf" });
    }
  });
});

router.post("/getCollegeData", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.send({ error: "Not Found" });
  }
  con.query(
    "SELECT * FROM collegeData WHERE userId=?",
    userId,
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.length > 0) {
        return res.send(result[0]);
      } else {
        return res.send("");
      }
    }
  );
});

router.get("/getbooksData", (req, res) => {
  con.query(
    "SELECT bookRecords.id,sellerId,bookName,authorName,publisherName,description,price,bookImgLink,buyerId,sellerStatus,buyerStatus,collegeName,regNo,branch,hostelAddress FROM bookRecords LEFT JOIN collegeData ON bookRecords.sellerId = collegeData.userId",
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.length > 0) {
        return res.send(result);
      } else {
        return res.send("");
      }
    }
  );
});

router.post("/getSellerDetails", (req, res) => {
  const { sellerId } = req.body;
  con.query(
    "SELECT user.name,user.mobileno,user.address, collegeData.collegeName,collegeData.hostelAddress, collegeData.regNo FROM collegeData ,user WHERE collegeData.userId =? AND user.id=?",
    [sellerId, sellerId],
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.length > 0) {
        return res.send(result);
      } else {
        return res.send("");
      }
    }
  );
});

router.post("/imgupload", (req, res) => {
  upload(req, res, (err) => {
    const id = req.body.id;
    const profileImg = req.body.profileImg;
    if (err instanceof multer.MulterError) {
      return res.send({ error: "File Too Large" });
    } else if (err) {
      return res.send({ error: "Something Went Wrong" });
    }

    if (profileImg && profileImg != "null") {
      const path = `./${profileImg}`;
      fs.unlink(path, (err) => {
        if (err) console.log(err);
      });
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

router.post("/pdfupload", (req, res) => {
  uploadPdf(req, res, (err) => {
    const { userId, topicName, category, description } = req.body;
    if (err instanceof multer.MulterError) {
      return res.send({ error: "File Too Large" });
    } else if (err) {
      return res.send({ error: "Something Went Wrong" });
    }
    con.query(
      "INSERT INTO pdfData SET userId=?,pdfName=?,category=?,pdfLink=?,description=?",
      [userId, topicName, category, req.file.path, description],
      (err, result) => {
        if (err) return res.status(422).send(err.message);
        if (result.affectedRows != 0) {
          return res.send({ success: "Pdf Uploaded Successfully" });
        } else {
          return res.send({ error: "Failed to Upload" });
        }
      }
    );
  });
});

router.post("/sellBook", (req, res) => {
  uploadSellerBook(req, res, (err) => {
    const {
      userId,
      bookName,
      authorName,
      publisherName,
      description,
      price,
    } = req.body;
    if (err instanceof multer.MulterError) {
      return res.send({ error: "File Too Large" });
    } else if (err) {
      return res.send({ error: "Something Went Wrong" });
    }

    con.query(
      "INSERT INTO bookRecords SET sellerID=?,bookName=?,authorName=?,publisherName=?,description=?,price=?,bookImgLink=?",
      [
        userId,
        bookName,
        authorName,
        publisherName,
        description,
        price,
        req.file.path,
      ],
      (err, result) => {
        if (err) return res.status(422).send(err.message);
        if (result.affectedRows != 0) {
          return res.send({ success: "Book Uploaded Successfully" });
        } else {
          return res.send({ error: "Failed to Upload" });
        }
      }
    );
  });
});

router.post("/updateprofile", (req, res) => {
  const { id, username, useremail, mobileNumber, userAddress } = req.body;
  if (!useremail || !mobileNumber || !username) {
    return res.send({ error: "All fields are required" });
  }
  con.query(
    "UPDATE user SET name =?,email=?,mobileno=?,address=? WHERE id= ?",
    [username, useremail, mobileNumber, userAddress, id],
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.affectedRows != 0) {
        return res.send({ success: "Profile Updated Successfully" });
      } else {
        return res.send({ error: "Failed Update" });
      }
    }
  );
});

router.post("/updateCollegeDetails", (req, res) => {
  const {
    userId,
    collegeName,
    regNo,
    branch,
    isHosteller,
    hostelAddress,
  } = req.body;
  if (!collegeName || !regNo || !branch) {
    return res.send({ error: "Must provide CollegeName,Reg. No, Branch" });
  }
  con.query(
    "SELECT COUNT(*) AS cnt FROM collegeData WHERE userID = ?",
    userId,
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result[0].cnt > 0) {
        con.query(
          "UPDATE collegeData SET collegeName=?,regNo=?,branch=?,isHosteller=?,hostelAddress=? WHERE userId=? ",
          [collegeName, regNo, branch, isHosteller, hostelAddress, userId],
          (err, result) => {
            if (err) return res.status(422).send(err.message);
            if (result.affectedRows != 0) {
              return res.send({
                success: "College Details Updated Successfully",
              });
            } else {
              return res.send({ error: "Failed Update" });
            }
          }
        );
      } else {
        con.query("INSERT INTO collegeData SET ?", req.body, (err, result) => {
          if (err) return res.status(422).send(err.message);
          if (result.affectedRows != 0) {
            return res.send({
              success: "College Details Uploaded Successfully",
            });
          } else {
            return res.send({ error: "Failed Uploaded" });
          }
        });
      }
    }
  );
});

router.post("/contactReqForSeller", (req, res) => {
  const { id, bookId } = req.body;
  con.query(
    "UPDATE bookRecords SET buyerId=?,buyerStatus=? WHERE id= ?",
    [id, 1, bookId],
    (err, result) => {
      if (err) return res.status(422).send(err.message);
      if (result.affectedRows != 0) {
        return res.send({ success: "Updated Successfully" });
      } else {
        return res.send({ error: "Failed Update" });
      }
    }
  );
});
router.post("/accept_RejectReq", (req, res) => {
  const { bookId, isRejected } = req.body;

  let sql = "UPDATE bookRecords SET sellerStatus=?, buyerStatus=? WHERE id= ?";
  let sqlValues = [1, 1, bookId];
  if (isRejected) {
    sql =
      "UPDATE bookRecords SET buyerId=?, sellerStatus=?, buyerStatus=? WHERE id= ?";
    sqlValues = [null, null, null, bookId];
  }
  con.query(sql, sqlValues, (err, result) => {
    if (err) return res.status(422).send(err.message);
    if (result.affectedRows != 0) {
      return res.send({ success: "Updated Successfully" });
    } else {
      return res.send({ error: "Failed Update" });
    }
  });
});

module.exports = router;
