// Username/password gate in front of the whole site. This only keeps casual
// visitors out of a demo: the values are not secret.
import { next } from '@vercel/functions';

const USER = 'mastronardi'; // compared without regard to case
const PASS = 'demo'; // also compared without regard to case

export default function middleware(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Basic ')) {
    const [user, ...rest] = atob(auth.slice(6)).split(':');
    if (user.trim().toLowerCase() === USER && rest.join(':').toLowerCase() === PASS) return next();
  }
  return new Response('Login required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="MGI Insight demo", charset="UTF-8"' },
  });
}
