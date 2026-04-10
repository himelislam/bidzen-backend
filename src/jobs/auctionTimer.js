const cron = require('node-cron');
const Auction = require('../models/Auction');
const auctionService = require('../services/auctionService');

// Auction timer job - runs every minute
const startAuctionTimer = () => {
    console.log('Starting auction timer job (runs every minute)...');

    // Schedule job to run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        console.log(`Running auction timer job at ${now.toISOString()}`);

        try {
            // Task 1: scheduled -> active
            // Find all scheduled auctions that should start now
            const scheduledToActive = await Auction.updateMany(
                {
                    status: 'scheduled',
                    startTime: { $lte: now }
                },
                { $set: { status: 'active' } }
            );

            if (scheduledToActive.modifiedCount > 0) {
                console.log(`Activated ${scheduledToActive.modifiedCount} auctions`);
            }

            // Task 2: active -> closed + winner determination
            // Find all active auctions that should end now
            const expiredAuctions = await Auction.find(
                {
                    status: 'active',
                    endTime: { $lte: now }
                },
                '_id startingPrice seller'
            ).lean();

            if (expiredAuctions.length > 0) {
                console.log(`Processing ${expiredAuctions.length} expired auctions for closing`);

                // Process each expired auction
                for (const auction of expiredAuctions) {
                    try {
                        await auctionService.closeAuction(auction._id, auction.startingPrice);
                        console.log(`Closed auction ${auction._id}`);
                    } catch (error) {
                        console.error(`Error closing auction ${auction._id}:`, error.message);
                    }
                }
            }

            // Log summary
            const totalProcessed = scheduledToActive.modifiedCount + expiredAuctions.length;
            if (totalProcessed > 0) {
                console.log(`Auction timer job completed: ${scheduledToActive.modifiedCount} activated, ${expiredAuctions.length} closed`);
            }

        } catch (error) {
            console.error('Error in auction timer job:', error);
        }
    });

    console.log('Auction timer job scheduled successfully');
};

// Stop auction timer job (for testing/shutdown)
const stopAuctionTimer = () => {
    cron.getTasks().forEach((task) => {
        task.stop();
    });
    console.log('Auction timer job stopped');
};

module.exports = {
    startAuctionTimer,
    stopAuctionTimer
};
