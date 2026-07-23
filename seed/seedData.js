/**
 * Seed script: populates the database with sample users, categories, and events.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Event = require('../models/Event');

const run = async () => {
  await connectDB();
  console.log('Clearing existing sample data...');
  await Promise.all([User.deleteMany({}), Category.deleteMany({}), Event.deleteMany({})]);

  console.log('Seeding users...');
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@eventplatform.com',
    password: 'Admin@123',
    role: 'super_admin',
    isEmailVerified: true,
  });

  const organizer = await User.create({
    name: 'Alex Organizer',
    email: 'organizer@eventplatform.com',
    password: 'Organizer@123',
    role: 'organizer',
    isEmailVerified: true,
    isOrganizerApproved: true,
  });

  const participant = await User.create({
    name: 'Sam Participant',
    email: 'participant@eventplatform.com',
    password: 'Participant@123',
    role: 'participant',
    isEmailVerified: true,
  });

  console.log('Seeding categories...');
  const categoryNames = ['Technical', 'Workshop', 'Cultural', 'Sports', 'Hackathon', 'Seminar'];
  const categories = await Category.insertMany(
    categoryNames.map((name) => ({
      name,
      slug: name.toLowerCase(),
      description: `${name} events`,
    }))
  );

  console.log('Seeding events...');
  const now = Date.now();
  const events = await Event.insertMany([
    {
      title: 'AI & Web3 Tech Summit',
      description: 'A full-day summit covering the latest in AI and Web3 technologies.',
      category: categories[0]._id,
      tags: ['ai', 'web3', 'tech'],
      venue: 'Grand Convention Center',
      startDate: new Date(now + 7 * 86400000),
      endDate: new Date(now + 7 * 86400000 + 8 * 3600000),
      time: '09:00 AM',
      capacity: 300,
      availableSeats: 300,
      ticketTiers: [
        { name: 'General', type: 'free', price: 0, quantity: 200 },
        { name: 'VIP', type: 'vip', price: 99, quantity: 100 },
      ],
      organizer: organizer._id,
      status: 'published',
      isApproved: true,
    },
    {
      title: 'React Advanced Workshop',
      description: 'Hands-on workshop covering advanced React patterns and performance tuning.',
      category: categories[1]._id,
      tags: ['react', 'frontend', 'workshop'],
      venue: 'Tech Hub Downtown',
      startDate: new Date(now + 3 * 86400000),
      endDate: new Date(now + 3 * 86400000 + 6 * 3600000),
      time: '10:00 AM',
      capacity: 60,
      availableSeats: 60,
      ticketTiers: [{ name: 'Standard', type: 'paid', price: 49, quantity: 60 }],
      organizer: organizer._id,
      status: 'published',
      isApproved: true,
    },
    {
      title: 'Campus Hackathon 2026',
      description: '24-hour hackathon for students to build and pitch innovative solutions.',
      category: categories[4]._id,
      tags: ['hackathon', 'students', 'coding'],
      venue: 'University Auditorium',
      startDate: new Date(now + 14 * 86400000),
      endDate: new Date(now + 15 * 86400000),
      time: '08:00 AM',
      capacity: 150,
      availableSeats: 150,
      ticketTiers: [
        { name: 'Early Bird', type: 'early_bird', price: 10, quantity: 50 },
        { name: 'General', type: 'paid', price: 20, quantity: 100 },
      ],
      organizer: organizer._id,
      status: 'published',
      isApproved: true,
    },
  ]);

  console.log('Seed complete!');
  console.log('----------------------------------------');
  console.log('Admin login:       admin@eventplatform.com / Admin@123');
  console.log('Organizer login:   organizer@eventplatform.com / Organizer@123');
  console.log('Participant login: participant@eventplatform.com / Participant@123');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
