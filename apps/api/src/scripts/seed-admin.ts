import { connectDatabase, UserRepository } from '@owl-mentors/database';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentor-app';
  await connectDatabase(mongoUri);

  const userRepo = new UserRepository();

  const email = 'admin@owlmentors.com';
  const password = 'Admin@123456';

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await userRepo.create({
    email,
    name: 'Admin',
    passwordHash,
    roles: ['admin'],
    emailVerified: true,
  });

  console.log('Admin account created:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  ID:       ${admin.id}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
