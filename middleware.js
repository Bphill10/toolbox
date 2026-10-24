// Username/password prompt in front of the demo. It only keeps casual
// visitors out: the values are not secret. Both are compared without
// regard to case.
import { next } from '@vercel/functions';

// The compensation analysis is open to anyone with the link; /_vercel carries
// the page-view analytics beacons.
const OPEN = ['/analysis', '/_vercel', '/manifest.json', '/sw.js', '/icon-'];
const login = { user: 'mastronardi', pass: 'demo', realm: 'MGI Insight demo' };

// Switched off: every page answers "Not found" until this line is removed.
const OFF = false;

export default function middleware(request) {
  if (OFF) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  const path = new URL(request.url).pathname;
  if (OPEN.some((prefix) => path.startsWith(prefix))) return next();
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    const [user, ...rest] = atob(auth.slice(6)).split(':');
    if (user.trim().toLowerCase() === login.user && rest.join(':').toLowerCase() === login.pass) return next();
  }
  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${login.realm}", charset="UTF-8"` },
  });
}
