/**
 * Migration script to convert existing Walk records to UserWalk records
 * 
 * This script finds all Walk records with a userid field (which indicates they are user bookings)
 * and creates corresponding UserWalk records, then deletes the original Walk records.
 * 
 * Usage: node migrateWalksToUserWalks.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Walk = require('../models/walk');
const UserWalk = require('../models/UserWalk');
const User = require('../models/User');

async function migrateWalks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.uri);
    console.log('Connected to MongoDB');

    // Find all Walk records with a userid field (user bookings)
    const userWalks = await Walk.find({ 
      userid: { $exists: true, $ne: null },
      status: 'scheduled' // Only migrate scheduled walks
    });

    console.log(`Found ${userWalks.length} user walks to migrate`);

    // Create UserWalk records for each Walk record
    let migratedCount = 0;
    let errorCount = 0;

    for (const walk of userWalks) {
      try {
        // Find the original walk record (the one with available times)
        const originalWalk = await Walk.findOne({
          marshall: walk.marshall,
          date: walk.date,
          availableTimes: { $exists: true },
          status: { $in: ['available', 'filled'] }
        });

        if (!originalWalk) {
          console.log(`Could not find original walk for user walk ${walk._id}`);
          continue;
        }

        // Create a new UserWalk record
        const userWalk = new UserWalk({
          userid: walk.userid,
          marshall: walk.marshall,
          walkId: originalWalk._id,
          date: walk.date,
          time: walk.time,
          status: walk.status
        });

        await userWalk.save();
        console.log(`Created UserWalk record ${userWalk._id} for Walk ${walk._id}`);

        // Update the user's walks array to reference the new UserWalk record
        await User.updateOne(
          { _id: walk.userid, walks: walk._id },
          { $pull: { walks: walk._id } }
        );
        await User.updateOne(
          { _id: walk.userid },
          { $addToSet: { walks: userWalk._id } }
        );

        // Update the marshall's walks array to reference the new UserWalk record
        await User.updateOne(
          { _id: walk.marshall, walks: walk._id },
          { $pull: { walks: walk._id } }
        );
        await User.updateOne(
          { _id: walk.marshall },
          { $addToSet: { walks: userWalk._id } }
        );

        // Delete the original Walk record
        await Walk.deleteOne({ _id: walk._id });
        console.log(`Deleted original Walk record ${walk._id}`);

        migratedCount++;
      } catch (error) {
        console.error(`Error migrating walk ${walk._id}:`, error);
        errorCount++;
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} walks with ${errorCount} errors.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateWalks();
