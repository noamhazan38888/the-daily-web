import { User } from '../models/User.js';

export function showLogin(req, res) {
  res.render('login', { error: null });
}

export async function login(req, res) {
  const username = String(req.body.username ?? '').trim();
  const password = String(req.body.password ?? '');

  if (!username || !password) {
    return res.status(400).render('login', {
      error: 'יש להזין שם משתמש וסיסמה'
    });
  }

  const user = await User.findOne({ username }).select('+passwordHash');
  const isValid = user && (await user.verifyPassword(password));

  if (!isValid) {
    return res.status(401).render('login', {
      error: 'שם המשתמש או הסיסמה שגויים'
    });
  }

  await new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
  req.session.user = user.toSafeObject();

  if (req.accepts('html')) {
    return res.redirect('/api/auth/me');
  }

  res.json({ user: req.session.user });
}

export function currentUser(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user: req.session.user });
}

export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('the-daily.sid');
    res.status(204).send();
  });
}
