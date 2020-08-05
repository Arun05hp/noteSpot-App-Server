require("dotenv").config({ path: __dirname + "/.env" });
const con = require("./mysql");
const bodyparser = require("body-parser");
const express = require("express");
const app = express();
const userReq = require("./fetch/fetchData");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// Body-parser middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.get("/", (req, res, next) => {
  res.end("Welcome to NoteSpot api");
});

// Routes
app.use("/user", userReq);
app.use("/uploads", express.static("uploads"));
app.use("/pdf", express.static("pdf"));
app.use("/books", express.static("books"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on Port ${port}...`));
