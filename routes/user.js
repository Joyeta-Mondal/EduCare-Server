const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");
const router = express.Router();

module.exports = (db) => {
  const userCollection = db.collection("userCollection");

  // Add user
  router.post("/add-user-data", async (req, res) => {
    try {
      const newUser = { ...req.body, role: "user" };
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add user" });
    }
  });

  //add google auth user data
  router.post("/add-google-user-data", async (req, res) => {
    try {
      const user = { ...req.body, role: "user" };

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ success: true });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add user" });
    }
  });

  //get all users
  router.get("/get-all-users", async (req, res) => {
    try {
      const users = await userCollection.find({}).toArray();
      res.send(users);
    } catch (error) {
      res.status(500).send({ error: "Failed to get users" });
    }
  });

  //get single user by email
  router.get("/get-user/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };

      const user = await userCollection.findOne(query);

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user);
    } catch (error) {
      res.status(500).send({ error: "Failed to get user" });
    }
  });

  // Search Users by name or email
  router.get("/search-users", async (req, res) => {
    try {
      const { query } = req.query; // Get the search query from query parameters

      if (!query || query.trim() === "") {
        return res.status(400).send({ error: "Search query is required" });
      }

      const searchRegex = new RegExp(query, "i"); // Case-insensitive regex for partial matching
      const searchQuery = {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      };

      const users = await userCollection.find(searchQuery).toArray();

      if (users.length === 0) {
        return res.status(404).send({ message: "No users found" });
      }

      res.send({ users });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).send({ error: "Failed to search users" });
    }
  });

  //------------------------------- Payment History ---------------------
  //post payment history
  // Add payment history
  router.post("/add-payment-history/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const newPayment = req.body; // Directly use req.body

      // console.log("New Payment:", newPayment);

      const update = {
        $set: {
          paymentHistory:
            user && user.paymentHistory
              ? [...user.paymentHistory, newPayment]
              : [newPayment],
        },
      };

      // console.log("Update Object:", update);

      const result = await userCollection.updateOne(query, update, {
        upsert: true,
      });

      // console.log("Update Result:", result);

      res.send(result);
    } catch (error) {
      console.error("Error updating payment history:", error);
      res.status(500).send({ error: "Failed to update payment history" });
    }
  });

  //get payment history
  router.get("/get-payment-history/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user.paymentHistory);
    } catch (error) {
      res.status(500).send({ error: "Failed to get payment history" });
    }
  });

  //my application

  //------------------------------- role ---------------------
  //update plan
  router.patch("/update-plan/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const update = { $set: { plan: req.body.plan } };
      const result = await userCollection.updateOne(query, update);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to update plan" });
    }
  });

  //---------------------------get review---------------------
  router.get("/get-review/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user.reviewedMeal);
    } catch (error) {
      res.status(500).send({ error: "Failed to get review" });
    }
  });

  // Edit review
  router.patch(
    "/edit-review/:email/:reviewId",
    verifyToken,
    async (req, res) => {
      try {
        const { email, reviewId } = req.params; // Extract email and reviewId from params
        const updatedReviewData = req.body; // Get updated review data from the request body

        // Find the user with the given email
        const query = { email };
        const user = await userCollection.findOne(query);

        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }

        // Update the specific review in the reviewedMeal array
        const updatedReviews = user.reviewedMeal.map((review) => {
          if (review.id === reviewId) {
            return { ...review, ...updatedReviewData }; // Merge updated review data
          }
          return review;
        });

        // Update the user document in the database
        const update = { $set: { reviewedMeal: updatedReviews } };
        const result = await userCollection.updateOne(query, update);

        if (result.modifiedCount === 0) {
          return res.status(400).send({ error: "Failed to update review" });
        }

        res.send({ message: "Review updated successfully" });
      } catch (error) {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  );

  // Delete review
  router.delete(
    "/delete-review/:email/:reviewId",
    verifyToken,
    async (req, res) => {
      try {
        const { email, reviewId } = req.params; // Extract email and reviewId from params

        // Find the user by email
        const query = { email };
        const user = await userCollection.findOne(query);

        if (!user) {
          return res.status(404).send({ error: "User not found" });
        }

        // Filter out the review with the given reviewId
        const updatedReviews = user.reviewedMeal.filter(
          (review) => review.id !== reviewId
        );

        if (updatedReviews.length === user.reviewedMeal.length) {
          return res.status(404).send({ error: "Review not found" });
        }

        // Update the user's reviewedMeal array in the database
        const update = { $set: { reviewedMeal: updatedReviews } };
        const result = await userCollection.updateOne(query, update);

        if (result.modifiedCount === 0) {
          return res.status(400).send({ error: "Failed to delete review" });
        }

        res.send({ message: "Review deleted successfully" });
      } catch (error) {
        res.status(500).send({ error: "Internal server error" });
      }
    }
  );

  //------------------------------admin--------------------------------

  //Make Admin
  router.patch("/make-admin/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const Role = req.body.Role;
      const query = { _id: new ObjectId(id) };
      const update = { $set: { role: Role } };
      const result = await userCollection.updateOne(query, update);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to make admin" });
    }
  });

  //check admin
  router.get("/check-admin/:email", async (req, res) => {
    try {
      const email = req.params.email;
      if (!email) {
        return res.status(403).send({ error: "Forbidden access" });
      }
      const query = { email: email };
      const isAdmin = await userCollection.findOne(query);
      res.send({ isAdmin });
    } catch (error) {
      res.status(500).send({ error: "Failed to get admin" });
    }
  });

  router.delete("/delete-user/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to delete user" });
    }
  });

  //----------------------------------------------
  //insert liked meals
  router.post("/insert-liked-meals/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const newLikedMeals = Array.isArray(req.body.likedMeals)
        ? req.body.likedMeals
        : [req.body.likedMeals];
      const update = {
        $set: {
          likedMeals:
            user && user.likedMeals
              ? [...user.likedMeals, ...newLikedMeals]
              : newLikedMeals,
        },
      };
      const result = await userCollection.updateOne(query, update, {
        upsert: true,
      });
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to update liked meals" });
    }
  });

  //insert reviewed university
  router.post(
    "/insert-reviewed-scholarships/:email",
    verifyToken,
    async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const newReviewedScholarship = Array.isArray(
          req.body.reviewedScholarship
        )
          ? req.body.reviewedScholarship
          : [req.body.reviewedScholarship];
        const update = {
          $set: {
            reviewedScholarship:
              user && user.reviewedMeal
                ? [...user.reviewedMeal, ...newReviewedScholarship]
                : newReviewedScholarship,
          },
        };
        const result = await userCollection.updateOne(query, update, {
          upsert: true,
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update liked mScholarship" });
      }
    }
  );

  //application
  //insert reviewed university
  router.post(
    "/insert-user-application/:email",
    verifyToken,
    async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const newUserApplication = Array.isArray(req.body.userApplication)
          ? req.body.userApplication
          : [req.body.userApplication];
        const update = {
          $set: {
            userApplication:
              user && user.userApplication
                ? [...user.userApplication, ...newUserApplication]
                : newUserApplication,
          },
        };
        const result = await userCollection.updateOne(query, update, {
          upsert: true,
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update liked mScholarship" });
      }
    }
  );

  //get my application
  //get payment history
  router.get("/get-my-application/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user.userApplication);
    } catch (error) {
      res.status(500).send({ error: "Failed to get payment history" });
    }
  });

  //----------------------------Requested Meal-----------------------------------
  //insert requested meals
  router.post(
    "/insert-requested-meals/:email",
    verifyToken,
    async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const newRequestedMeal = Array.isArray(req.body.requestedMeal)
          ? req.body.requestedMeal
          : [req.body.requestedMeal];
        const update = {
          $set: {
            requestedMeal:
              user && user.requestedMeal
                ? [...user.requestedMeal, ...newRequestedMeal]
                : newRequestedMeal,
          },
        };
        const result = await userCollection.updateOne(query, update, {
          upsert: true,
        });
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update requested meals" });
      }
    }
  );

  //get requested meals
  router.get("/get-requested-meals/:email", verifyToken, async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send(user.requestedMeal);
    } catch (error) {
      res.status(500).send({ error: "Failed to get requested meals" });
    }
  });

  return router;
};
