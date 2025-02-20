require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectToDatabase = require("./database/mongoClient");
const verifyToken = require("./middleware/verifyToken");
const universityRoutes = require("./routes/university");
const applicationRoutes = require("./routes/application");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const reviewRoutes = require("./routes/review");
const paymentRoutes = require("./routes/payment");
const requestedMealRoutes = require("./routes/requestedMeal");

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://edu-care-e1c6c.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Main Function
async function main() {
  try {
    const client = await connectToDatabase();
    const db = client.db("cloud-hostel");

    // Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes(db));
    app.use("/api/university", universityRoutes(db));
    app.use("/api/review", reviewRoutes(db));
    app.use("/api/payment", paymentRoutes(db));
    app.use("/api/requested-meal", requestedMealRoutes(db));
    app.use("/api/application", applicationRoutes(db));

    //err handle
    app.get("/favicon.ico", (req, res) => res.status(204).end());
    app.get("/favicon.png", (req, res) => res.status(204).end());

    // Root Endpoint
    app.get("/", (req, res) => {
      res.send("eduCare server running");
    });

    // Start Server
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on port: ${port}`));
  } catch (error) {
    console.error("Failed to start server:", error);
  }
}

main();


//---------------------------------------

// require("dotenv").config();
// const express = require("express");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");

// const connectToDatabase = require("./database/mongoClient");
// const verifyToken = require("./middleware/verifyToken");
// const universityRoutes = require("./routes/university");
// const applicationRoutes = require("./routes/application");
// const authRoutes = require("./routes/auth");
// const userRoutes = require("./routes/user");
// const reviewRoutes = require("./routes/review");
// const paymentRoutes = require("./routes/payment");
// const requestedMealRoutes = require("./routes/requestedMeal");

// const app = express();

// // Middleware
// app.use(
//   cors({
//     origin: ["http://localhost:5174", "https://edu-care-e1c6c.web.app/"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());

// // Main Function
// async function main() {
//   try {
//     const client = await connectToDatabase();
//     const db = client.db("cloud-hostel");

//     // Routes
//     app.use("/api/auth", authRoutes);
//     app.use("/api/user", userRoutes(db));
//     app.use("/api/university", universityRoutes(db));
//     app.use("/api/review", reviewRoutes(db));
//     app.use("/api/payment", paymentRoutes(db));
//     app.use("/api/requested-meal", requestedMealRoutes(db));
//     app.use("/api/application", applicationRoutes(db));

//     // Root Endpoint
//     app.get("/", (req, res) => {
//       res.send("eduCare server running");
//     });

//     // Start Server
//     const port = process.env.PORT || 3000;
//     app.listen(port, () => console.log(`Server running on port: ${port}`));
//   } catch (error) {
//     console.error("Failed to start server:", error);
//   }
// }

// main();
