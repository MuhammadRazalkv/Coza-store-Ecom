// Mongoose connection
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const adminRoute = require("./routes/adminRoute");
const { webhook } = require("./controller/user/orderController");
const nocache = require("nocache");
const userRoute = require("./routes/userRoute");
const connectDB = require("./config/db");

app.post("/webhook/stripe", express.raw({ type: "application/json" }), webhook);
connectDB();
app.use(nocache());

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
  })
);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "/public")));

app.set("view engine", "ejs");
app.set("views", "./view/user");

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.all("*", (req, res) => {
  res.render("404error", { message: undefined });
});

app.listen(3000, () => {
  console.log("server running on http://localhost:3000");
});
