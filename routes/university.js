const { ObjectId } = require("mongodb");

const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

module.exports = (db) => {
  const universityCollection = db.collection("universityCollection");

  // Add university
  router.post("/add-university", async (req, res) => {
    try {
      const newFood = req.body;
      const result = await universityCollection.insertOne(newFood);
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add university" });
    }
  });

  // Add liked university
  router.post("/add-liked-university", verifyToken, async (req, res) => {
    try {
      const newFood = req.body;
      newFood._id = new ObjectId(newFood._id);
      const result = await universityCollection.insertOne(newFood);
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
        const universities = await universityCollection
          .aggregate([
            { $sort: { postDate: -1, applicationFees: 1 } },
            { $limit: 6 },
          ])
          .toArray();

        return res.status(200).json(universities); // Return JSON
      }

      const universities = await universityCollection.find({}).toArray();
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
  //     const universitys = await universityCollection.find(query).toArray();
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

      const university = await universityCollection.findOne(query);

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
    const result = await universityCollection.updateOne(
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
    const result = await universityCollection.deleteOne({ _id: objectId });
    res.send(result);
  });

  // Search universitys by title
  router.get("/search-university", async (req, res) => {
    try {
      const { query } = req.query; // Get the search query from query parameters

      if (!query || query.trim() === "") {
        return res.status(400).send({ error: "Search query is required" });
      }

      const searchRegex = new RegExp(query, "i"); // Case-insensitive regex for partial matching
      const searchQuery = {
        $or: [
          {
            universityName: { $regex: searchRegex },
          },
          // { email: { $regex: searchRegex } },
        ],
      };

      const universitys = await universityCollection
        .find(searchQuery)
        .toArray();

      if (universitys.length === 0) {
        return res.status(404).send({ message: "No university found" });
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

      const universitys = await universityCollection
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

  //filter universitys by price range
  router.get("/filter-universitys-by-price", async (req, res) => {
    try {
      const { minPrice, maxPrice } = req.query;

      if (!minPrice || !maxPrice) {
        return res.status(400).send({ error: "Price range is required" });
      }

      const searchQuery = {
        price: { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) },
      };

      const universitys = await universityCollection
        .find(searchQuery)
        .toArray();

      if (universitys.length === 0) {
        return res.status(404).send({ message: "No universitys found" });
      }

      res.send({ universitys });
    } catch (error) {
      console.error("Error filtering universitys by price:", error);
      res.status(500).send({ error: "Failed to filter universitys by price" });
    }
  });

  //increase like count
  router.patch("/increase-like/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const university = await universityCollection.findOne({ _id: objectId });
    const updateduniversity = { ...university, likes: university.likes + 1 };
    const result = await universityCollection.updateOne(
      { _id: objectId },
      { $set: updateduniversity }
    );
    res.send(result);
  });

  //increase review count
  router.patch("/increase-review/:id", verifyToken, async (req, res) => {
    const id = req.params.id;
    // Convert id to ObjectId
    const objectId = new ObjectId(id);
    const university = await universityCollection.findOne({ _id: objectId });
    const updateduniversity = {
      ...university,
      reviewsCount: university.reviewsCount + 1,
    };
    const result = await universityCollection.updateOne(
      { _id: objectId },
      { $set: updateduniversity }
    );
    res.send(result);
  });

  //-------------------------Upcoming universitys--------------------------------

  const upcominguniversityCollection = db.collection(
    "upcominguniversityCollection"
  );

  // Add upcoming university
  router.post("/add-upcoming-university", verifyToken, async (req, res) => {
    try {
      const newUpcominguniversity = req.body;
      const result = await upcominguniversityCollection.insertOne(
        newUpcominguniversity
      );
      res.send(result);
    } catch (error) {
      res.status(500).send({ error: "Failed to add upcoming university" });
    }
  });

  //update a new data to upcoming universitys
  router.patch(
    "/update-upcoming-university/:id",
    verifyToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const update = { $set: { isPublished: true } };
        const result = await upcominguniversityCollection.updateOne(
          query,
          update
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to update" });
      }
    }
  );

  //get upcoming universitys
  router.get("/get-upcoming-universitys", async (req, res) => {
    try {
      const upcominguniversitys = await upcominguniversityCollection
        .find({})
        .toArray();
      res.send(upcominguniversitys);
    } catch (error) {
      res.status(500).send({ error: "Failed to fetch upcoming universitys" });
    }
  });

  //get single upcoming university details
  router.get(
    "/get-upcoming-university-details/:id",
    verifyToken,
    async (req, res) => {
      try {
        const id = req.params.id;
        const objectId = new ObjectId(id);
        const query = { _id: objectId };
        const upcominguniversity = await upcominguniversityCollection.findOne(
          query
        );
        if (!upcominguniversity) {
          return res
            .status(404)
            .send({ error: "Upcoming university not found" });
        }
        res.send(upcominguniversity);
      } catch (error) {
        console.error("Error fetching upcoming university details:", error);
        res
          .status(500)
          .send({ error: "Failed to fetch upcoming university details" });
      }
    }
  );

  //increase like count
  router.patch(
    "/increase-upcoming-university-like/:id",
    verifyToken,
    async (req, res) => {
      const id = req.params.id;
      // Convert id to ObjectId
      const objectId = new ObjectId(id);
      const university = await upcominguniversityCollection.findOne({
        _id: objectId,
      });
      const updateduniversity = { ...university, likes: university.likes + 1 };
      const result = await upcominguniversityCollection.updateOne(
        { _id: objectId },
        { $set: updateduniversity }
      );
      res.send(result);
    }
  );

  return router;
};
