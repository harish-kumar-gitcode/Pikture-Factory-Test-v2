/**
 * One-time script to create the first Admin login.
 * Run with: npm run seed:admin
 * Reads SEED_ADMIN_* values from .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing in .env');

  await mongoose.connect(uri);

  const AdminSchema = new mongoose.Schema(
    { name: String, email: String, password: String, avatar: String },
    { timestamps: true }
  );
  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@pikturefactory.com').toLowerCase();
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`Admin already exists for ${email} — nothing to do.`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'changeme123', 10);
  await Admin.create({
    name: process.env.SEED_ADMIN_NAME || 'Admin User',
    email,
    password: hashed,
  });

  console.log(`✅ Admin created: ${email} / ${process.env.SEED_ADMIN_PASSWORD || 'changeme123'}`);
  console.log('Please log in and change this password immediately from Settings.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
