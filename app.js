require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");

const app = express();
const server = http.createServer(app);

const dbRoute = require("./router/dbRoute");

app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Content-Security-Policy", "frame-ancestors: 'none'");
  next();
});

app.get("/", (req, res) => {
  res.send("welcome to home page");
});

app.use("/api", dbRoute);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
