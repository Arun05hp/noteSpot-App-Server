require("dotenv").config({ path: __dirname + "/.env" });
const con = require("./mysql");
const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const appRoutes = require("./routes/appRoutes");
const requireAuth = require("./middlewares/requireAuth");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/user", authRoutes);
app.use("/user/app", appRoutes);
app.use("/uploads", express.static("uploads"));

app.use("/pdf", express.static("pdf"));
app.use("/books", express.static("books"));

// Routes

app.get("/", requireAuth, (req, res, next) => {
  res.end("Welcome to NoteSpot api");
});

const port = 3000;
app.listen(port, () => console.log(`Listening on Port ${port}...`));
