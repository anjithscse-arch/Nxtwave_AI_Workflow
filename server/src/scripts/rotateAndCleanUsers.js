import mongoose from 'mongoose';
import config from '../config/env.js';
import User from '../models/User.js';

async function purgeAllNonRotatedUsers() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to Atlas DB:', mongoose.connection.name);

  // Keep ONLY the two official rotated accounts
  const officialEmails = [
    'admin.dev@campusmind.internal',
    'student.dev@campusmind.internal'
  ];

  const deleteResult = await User.deleteMany({ email: { $nin: officialEmails } });
  console.log(`🗑️  Purged all non-official/legacy accounts: ${deleteResult.deletedCount} deleted.`);

  const currentUsers = await User.find({}, 'name email role createdAt').lean();
  console.log('\n================================================================');
  console.log(`📋 CURRENT ACTIVE ACCOUNTS IN PRODUCTION DATABASE (${currentUsers.length} total):`);
  console.log('================================================================');
  currentUsers.forEach((u, i) => {
    console.log(`[${i + 1}] Email: ${u.email} | Role: ${u.role} | Name: "${u.name}" | Created: ${u.createdAt}`);
  });

  await mongoose.disconnect();
}

purgeAllNonRotatedUsers().catch(console.error);
