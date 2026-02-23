import mongoose from 'mongoose';
await mongoose.connect('mongodb://localhost:27017/mentor-app');
const db = mongoose.connection.db!;
const users = await db.collection('users').find({}, { projection: { email: 1, roles: 1 } }).toArray();
console.log('Total users:', users.length);
for (const u of users) {
  console.log(JSON.stringify({ email: u.email, roles: u.roles }));
}
await mongoose.disconnect();
