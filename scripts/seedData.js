const mongoose = require('mongoose');
const Auction = require('../src/models/Auction');
const User = require('../src/models/User');
const Bid = require('../src/models/Bid');
const Feedback = require('../src/models/Feedback');
const config = require('../src/config/env');

// Dummy auction data
const dummyAuctions = [
  {
    title: "MacBook Pro 16-inch M2 Pro",
    description: "Brand new MacBook Pro 16-inch with M2 Pro chip, 16GB RAM, 512GB SSD. Includes original box, charger, and AppleCare+ warranty. Excellent condition, barely used.",
    startingPrice: 150000,
    currentHighestBid: 175000,
    status: 'active',
    startTime: new Date('2026-04-14T10:00:00.000Z'),
    endTime: new Date('2026-04-14T22:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "iPhone 15 Pro Max 256GB",
    description: "iPhone 15 Pro Max in Natural Titanium color, 256GB storage. Like new condition with original box and accessories. Screen protector applied since day one.",
    startingPrice: 95000,
    currentHighestBid: 108000,
    status: 'active',
    startTime: new Date('2026-04-14T11:00:00.000Z'),
    endTime: new Date('2026-04-14T23:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "Sony PlayStation 5 Console",
    description: "PS5 Console with DualSense controller, HDMI cable, and power cord. Includes 3 games: God of War Ragnarök, Spider-Man 2, and Horizon Forbidden West. Excellent working condition.",
    startingPrice: 45000,
    currentHighestBid: 52000,
    status: 'active',
    startTime: new Date('2026-04-14T09:00:00.000Z'),
    endTime: new Date('2026-04-14T21:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "Canon EOS R6 Mirrorless Camera",
    description: "Canon EOS R6 with 24-105mm lens, battery, charger, and camera bag. Professional mirrorless camera with 20MP full-frame sensor. Perfect for photography enthusiasts.",
    startingPrice: 180000,
    currentHighestBid: 195000,
    status: 'active',
    startTime: new Date('2026-04-14T12:00:00.000Z'),
    endTime: new Date('2026-04-15T00:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "Dell XPS 13 Laptop",
    description: "Dell XPS 13 with Intel i7 processor, 16GB RAM, 512GB SSD, 13.4-inch 4K display. Ultra-portable laptop in excellent condition with original charger.",
    startingPrice: 85000,
    currentHighestBid: 92000,
    status: 'active',
    startTime: new Date('2026-04-14T10:30:00.000Z'),
    endTime: new Date('2026-04-14T22:30:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "Samsung Galaxy Watch 6",
    description: "Samsung Galaxy Watch 6 44mm in Black, with original charger and bands. Health tracking, GPS, water resistant. Like new condition.",
    startingPrice: 25000,
    currentHighestBid: 28000,
    status: 'closed',
    startTime: new Date('2026-04-13T10:00:00.000Z'),
    endTime: new Date('2026-04-13T20:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "iPad Air 5th Gen 64GB",
    description: "iPad Air 5th generation with 64GB storage, Wi-Fi only, Space Gray color. Includes original box and Apple Pencil 2. Excellent condition.",
    startingPrice: 55000,
    currentHighestBid: 58000,
    status: 'closed',
    startTime: new Date('2026-04-13T14:00:00.000Z'),
    endTime: new Date('2026-04-14T02:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "Vintage Rolex Submariner",
    description: "Vintage Rolex Submariner from 1970s, automatic movement, stainless steel case and bracelet. Recently serviced and in excellent working condition. Rare collector's item.",
    startingPrice: 500000,
    currentHighestBid: 450000,
    status: 'closed',
    startTime: new Date('2026-04-12T10:00:00.000Z'),
    endTime: new Date('2026-04-13T10:00:00.000Z'),
    flaggedForReview: true,
    adminNotes: "Flagged for review - winning bid below 50% of starting price"
  },
  {
    title: "Microsoft Surface Pro 9",
    description: "Microsoft Surface Pro 9 with Intel i5, 8GB RAM, 256GB SSD, 13-inch touchscreen. Includes Type Cover and Surface Pen. Excellent condition with original box.",
    startingPrice: 75000,
    currentHighestBid: 0,
    status: 'scheduled',
    startTime: new Date('2026-04-14T16:00:00.000Z'),
    endTime: new Date('2026-04-15T04:00:00.000Z'),
    flaggedForReview: false
  },
  {
    title: "AirPods Pro 2nd Gen",
    description: "Apple AirPods Pro 2nd generation with MagSafe charging case. Active noise cancellation, spatial audio. Like new condition with original box.",
    startingPrice: 20000,
    currentHighestBid: 0,
    status: 'scheduled',
    startTime: new Date('2026-04-14T18:00:00.000Z'),
    endTime: new Date('2026-04-15T06:00:00.000Z'),
    flaggedForReview: false
  }
];

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.mongo.uri);
    console.log('Connected to MongoDB');

    // Get existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      process.exit(1);
    }

    const sellers = users.filter(user => user.role === 'seller');
    const buyers = users.filter(user => user.role === 'buyer');

    if (sellers.length === 0) {
      console.log('No sellers found. Please create seller accounts first.');
      process.exit(1);
    }

    // Clear existing auctions
    await Auction.deleteMany({});
    console.log('Cleared existing auctions');

    // Create auctions with random sellers
    const createdAuctions = [];
    for (let i = 0; i < dummyAuctions.length; i++) {
      const auctionData = dummyAuctions[i];
      const randomSeller = sellers[Math.floor(Math.random() * sellers.length)];
      
      const auction = await Auction.create({
        ...auctionData,
        seller: randomSeller._id
      });

      createdAuctions.push(auction);
      console.log(`Created auction: ${auction.title}`);
    }

    // Create some bids for active and closed auctions
    const activeAuctions = createdAuctions.filter(a => a.status === 'active');
    const closedAuctions = createdAuctions.filter(a => a.status === 'closed');

    // Create bids for active auctions
    for (const auction of activeAuctions) {
      if (buyers.length > 0) {
        const bidCount = Math.floor(Math.random() * 3) + 1; // 1-3 bids
        for (let i = 0; i < bidCount; i++) {
          const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
          const bidAmount = auction.startingPrice + (Math.random() * (auction.currentHighestBid - auction.startingPrice));
          
          await Bid.create({
            auction: auction._id,
            bidder: randomBuyer._id,
            amount: Math.round(bidAmount)
          });
        }
        console.log(`Created bids for: ${auction.title}`);
      }
    }

    // Create bids and set winners for closed auctions
    for (const auction of closedAuctions) {
      if (buyers.length > 0 && auction.currentHighestBid > 0) {
        const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
        
        // Create winning bid
        await Bid.create({
          auction: auction._id,
          bidder: randomBuyer._id,
          amount: auction.currentHighestBid
        });

        // Set winner
        await Auction.findByIdAndUpdate(auction._id, {
          winner: randomBuyer._id
        });
        console.log(`Set winner for closed auction: ${auction.title}`);
      }
    }

    // Create feedback for closed auctions with winners
    for (const auction of closedAuctions) {
      if (auction.winner) {
        // Winner gives feedback to seller
        await Feedback.create({
          auction: auction._id,
          author: auction.winner,
          recipient: auction.seller,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          reviewText: "Great seller! Item exactly as described and shipping was fast."
        });

        // Seller gives feedback to winner
        await Feedback.create({
          auction: auction._id,
          author: auction.seller,
          recipient: auction.winner,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          reviewText: "Excellent buyer! Quick payment and great communication."
        });
        console.log(`Created feedback for: ${auction.title}`);
      }
    }

    console.log('\n=== Database Seeded Successfully ===');
    console.log(`Created ${dummyAuctions.length} auctions`);
    console.log(`${activeAuctions.length} active auctions`);
    console.log(`${closedAuctions.length} closed auctions`);
    console.log(`${createdAuctions.filter(a => a.status === 'scheduled').length} scheduled auctions`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedDatabase();
