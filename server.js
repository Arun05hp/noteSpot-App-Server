require("dotenv").config({ path: __dirname + "/.env" });
const con = require("./mysql");
const bodyparser = require("body-parser");
const express = require("express");
const app = express();

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
  res.end("Welcome to Craffic api");
});

// Routes
app.use("/user", require("./fetch/fetchData"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on Port ${port}...`));
