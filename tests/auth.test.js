/**
 * Sample API test for the auth register/login flow.
 * Requires a running MongoDB instance (set MONGO_URI in .env.test or use mongodb-memory-server).
 * Run with: npm test
 */
const request = require('supertest');
const mongoose = require('mongoose');
require('dotenv').config();
const app = require('../app');
const User = require('../models/User');

const TEST_EMAIL = `test-${Date.now()}@example.com`;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await User.deleteOne({ email: TEST_EMAIL });
  await mongoose.connection.close();
});

describe('Auth API', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: TEST_EMAIL,
      password: 'Password123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL,
      password: 'WrongPassword',
    });
    expect(res.statusCode).toBe(401);
  });
});
