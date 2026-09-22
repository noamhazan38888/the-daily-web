import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';

await connectDatabase();

const users = [
  { username: 'reporter.demo', displayName: 'כתב הדגמה', role: 'reporter', password: 'Reporter123!' },
  { username: 'editor.demo', displayName: 'עורך הדגמה', role: 'editor', password: 'Editor123!' }
];

for (const userData of users) {
  const user = await User.findOneAndUpdate(
    { username: userData.username },
    { $set: { displayName: userData.displayName, role: userData.role } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select('+passwordHash');

  user.setPassword(userData.password);
  await user.save();
}

console.log('Demo users created: reporter.demo / Reporter123!, editor.demo / Editor123!');
await disconnectDatabase();
