import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { UserModel } from '../models/user.model';

const run = async () => {
  await connectDb();

  const duplicates = await UserModel.aggregate<{
    phone: string;
    count: number;
    users: { _id: mongoose.Types.ObjectId; email: string }[];
  }>([
    {
      $match: {
        phone: { $exists: true, $ne: null, $type: 'string' }
      }
    },
    {
      $project: {
        phone: { $trim: { input: '$phone' } },
        email: 1
      }
    },
    {
      $match: {
        phone: { $ne: '' }
      }
    },
    {
      $group: {
        _id: '$phone',
        count: { $sum: 1 },
        users: { $push: { _id: '$_id', email: '$email' } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        phone: '$_id',
        count: 1,
        users: 1
      }
    },
    {
      $sort: { count: -1, phone: 1 }
    }
  ]);

  if (duplicates.length === 0) {
    console.log('No duplicate phone numbers found.');
    return;
  }

  console.error(`Found ${duplicates.length} duplicate phone value(s).`);
  for (const item of duplicates) {
    console.error(`- ${item.phone} (${item.count} users)`);
    for (const user of item.users) {
      console.error(`  - userId=${String(user._id)} email=${user.email}`);
    }
  }

  process.exitCode = 1;
};

run()
  .catch((error) => {
    console.error('Failed to check duplicate phone numbers:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {
      // Ignore disconnect errors on exit.
    });
  });
