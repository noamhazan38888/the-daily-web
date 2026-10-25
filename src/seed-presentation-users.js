import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';

// Additive: creates or updates only these users and never touches other data.
const EDITOR_NAMES = ['Dana', 'Yuval', 'Shahar', 'Noam', 'Itay'];
const PASSWORD = 'Password1';

await connectDatabase();

for (const name of EDITOR_NAMES) {
  const user = await User.findOneAndUpdate(
    { username: name.toLowerCase() },
    { $set: { displayName: name, role: 'editor' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).select('+passwordHash');

  user.setPassword(PASSWORD);
  await user.save();
}

console.log(`Editors ready: ${EDITOR_NAMES.map((name) => name.toLowerCase()).join(', ')} (password: ${PASSWORD})`);

await disconnectDatabase();
