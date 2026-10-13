// Username/password prompts in front of the site. They only keep casual
// visitors out of a demo: the values are not secret. Both are compared
// without regard to case.
import { next } from '@vercel/functions';

// The compensation analysis has its own login, so people who only have the
// demo login cannot open it.
const LOGINS = [
  { prefix: '/analysis', user: 'mastronardi', pass: 'comp', realm: 'Compensation analysis' },
  { prefix: '/', user: 'mastronardi', pass: 'demo', realm: 'MGI Insight demo' },
];

export default function middleware(request) {
  const path = new URL(request.url).pathname;
  const login = LOGINS.find((l) => path.startsWith(l.prefix));
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
