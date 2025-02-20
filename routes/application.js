const { ObjectId } = require("mongodb");

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

module.exports = (db) => {
  const applicationCollection = db.collection("applicationCollection");

  // Add application
  router.post("/add-application", async (req, res) => {
    try {
      const newApplication = req.body;
      const result = await applicationCollection.insertOne(newApplication);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add university" });
    }
  });

  //get all applications
  router.get("/get-all-applications", async (req, res) => {
    try {
      const applications = await applicationCollection.find({}).toArray();
      res.send(applications);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch applications" });
    }
  });

  //get single application
  router.get("/get-application/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const application = await applicationCollection.findOne(query);
      res.send(application);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch application" });
    }
  });

  // Add liked university
  router.post("/add-liked-university", verifyToken, async (req, res) => {
    try {
      const newFood = req.body;
      newFood._id = new ObjectId(newFood._id);
      const result = await applicationCollection.insertOne(newFood);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add university" });
    }
  });

  // Get universitys
  router.get("/get-featured-university", async (req, res) => {
    try {
      const universityType = req.query.universityType;

      if (universityType === "featured") {
        const universities = await applicationCollection
          .aggregate([
            { $sort: { postDate: -1, applicationFees: 1 } },
            { $limit: 6 },
          ])
          .toArray();

        return res.status(200).json(universities); // Return JSON
      }

      const universities = await applicationCollection.find({}).toArray();
      res.status(200).json(universities); // Return JSON
    } catch (error) {
      console.error("Error fetching universities:", error.message);
      res.status(500).json({ error: "Failed to fetch universities" });
    }
  });

  // router.get("/get-featured-university", async (req, res) => {
  //   try {
  //     const universityType = req.query.universityType;
  //     const query =
  //       universityType && universityType !== "all" ? { universityType } : {};
  //     const universitys = await applicationCollection.find(query).toArray();
  //     res.send(universitys);
  //   } catch (error) {
  //     res.status(500).send({ error: "Failed to fetch university" });
  //   }
  // });

  // Get single university details
  router.get("/get-university-details/:id", verifyToken, async (req, res) => {
    try {
      const id = req.params.id;

      // Validate if the ID is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid university ID format" });
      }

      const objectId = new ObjectId(id);
      const query = { _id: objectId };

      const university = await applicationCollection.findOne(query);

      if (!university) {
        return res.status(404).send({ error: "university not found" });
      }

      res.send(university);
    } catch (error) {
      console.error("Error fetching university details:", error); // Log for debugging
      res.status(500).send({ error: "Failed to fetch university details" });
    }
  });

  //update a university
  router.patch("/update-university/:id", async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const updatedUniversity = req.body;
    const result = await applicationCollection.updateOne(
      { _id: objectId },
      { $set: updatedUniversity }
    );
    res.send(result);
  });

  // Delete a university

  router.delete("/delete-university/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const result = await applicationCollection.deleteOne({ _id: objectId });
    res.send(result);
  });

  // Search universitys by title
  router.get("/search-universitys", async (req, res) => {
    try {
      const { query } = req.query; // Get the search query from query parameters

      if (!query || query.trim() === "") {
        return res.status(400).send({ error: "Search query is required" });
      }

      const searchRegex = new RegExp(query, "i"); // Case-insensitive regex for partial matching
      const searchQuery = {
        $or: [
          {
            title: { $regex: searchRegex },
          },
          // { email: { $regex: searchRegex } },
        ],
      };

      const universitys = await applicationCollection
        .find(searchQuery)
        .toArray();

      if (universitys.length === 0) {
        return res.status(404).send({ message: "No universitys found" });
      }

      res.send({ universitys });
    } catch (error) {
      console.error("Error searching universitys:", error);
      res.status(500).send({ error: "Failed to search universitys" });
    }
  });

  //filter universitys by category
  router.get("/filter-universitys", async (req, res) => {
    try {
      const { category } = req.query;

      if (!category || category.trim() === "") {
        return res.status(400).send({ error: "Category is required" });
      }

      const searchQuery = {
        universityType: category,
      };

      const universitys = await applicationCollection
        .find(searchQuery)
        .toArray();

      if (universitys.length === 0) {
        return res.status(404).send({ message: "No universitys found" });
      }

      res.send({ universitys });
    } catch (error) {
      console.error("Error filtering universitys:", error);
      res.status(500).send({ error: "Failed to filter universitys" });
    }
  });

  return router;
};
