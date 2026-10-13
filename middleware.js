// Username/password prompt in front of the demo. It only keeps casual
// visitors out: the values are not secret. Both are compared without
// regard to case.
import { next } from '@vercel/functions';

// The compensation analysis is open to anyone with the link; /_vercel carries
// the page-view analytics beacons.
const OPEN = ['/analysis', '/_vercel'];
const login = { user: 'mastronardi', pass: 'demo', realm: 'MGI Insight demo' };

export default function middleware(request) {
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
