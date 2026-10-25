import { randomUUID } from 'node:crypto';

const COOKIE = 'the-daily.vid';
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const VALID_ID = /^[0-9a-f-]{36}$/i;

// Anonymous per-browser identifier. Unlike the session (which is not persisted for
// guests), this cookie lets us remember which articles a device has already read.
export function identifyViewer(req, res, next) {
	const match = /(?:^|;\s*)the-daily\.vid=([^;]+)/.exec(req.headers.cookie ?? '');
	let id = match?.[1];
	if (!id || !VALID_ID.test(id)) {
		id = randomUUID();
		res.cookie(COOKIE, id, {
			httpOnly: true,
			sameSite: 'lax',
			secure: req.secure,
			maxAge: ONE_YEAR_MS
		});
	}
	req.viewerId = id;
	next();
}
