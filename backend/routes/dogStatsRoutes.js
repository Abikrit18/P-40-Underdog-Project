const express = require('express');
const router = express.Router();
const WalkLog = require('../models/walkLog');

// Get total walks per dog (only completed walks)
router.get('/dogs/walk-counts', async (req, res) => {
  try {
    const results = await WalkLog.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: "$dogs" },
      {
        $lookup: {
          from: "dogs", // name of your dogs collection
          localField: "dogs",
          foreignField: "name",
          as: "dogDetails"
        }
      },
      { $match: { "dogDetails.0": { $exists: true } } }, // filter invalid names
      {
        $group: {
          _id: { dog: "$dogs", date: "$date" },
          totalWalks: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.dog",
          walks: {
            $push: {
              date: "$_id.date",
              count: "$totalWalks"
            }
          },
          totalWalks: { $sum: "$totalWalks" }
        }
      },
      { $sort: { totalWalks: -1 } }
    ]);
    res.json(results);
  } catch (error) {
    console.error("Error fetching dog walk counts:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

module.exports = router;