import http from 'k6/http';
import { check } from 'k6';

const BASE_URL_AUTH = 'http://localhost:8001';

export function login() {
  const res = http.post(
    `${BASE_URL_AUTH}/api/v1/auth/login`,
    JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(res, {
    'login success': (r) => r.status === 200,
  });

  const body = JSON.parse(res.body);
  return body.data?.access_token || body.token;
}