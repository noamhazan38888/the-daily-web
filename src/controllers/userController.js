import { User } from '../models/User.js';

export async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ users: users.map((user) => user.toSafeObject()) });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: user.toSafeObject() });
}

export async function createUser(req, res) {
  const user = new User({
    username: req.body.username,
    displayName: req.body.displayName,
    role: req.body.role
  });
  user.setPassword(String(req.body.password ?? ''));
  await user.save();
  res.status(201).json({ user: user.toSafeObject() });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id).select('+passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (req.body.username !== undefined) user.username = req.body.username;
  if (req.body.displayName !== undefined) user.displayName = req.body.displayName;
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.password !== undefined) user.setPassword(String(req.body.password));
  await user.save();

  res.json({ user: user.toSafeObject() });
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
}
