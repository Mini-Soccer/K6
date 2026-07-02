import http from 'k6/http';
import { check } from 'k6';

import { login } from '../utils/auth.js';
import { generateHeaders } from '../utils/header-field-service.js';

import { Counter, Trend } from 'k6/metrics';

// ================= CONSTANT =================
const BASE_URL_FIELD = 'http://localhost:8002';

// ================= CUSTOM METRICS =================
const rateLimited = new Counter('rate_limited');
const successReq = new Counter('success_req');
const rateLimitRatio = new Trend('rate_limit_ratio');

// ================= CONFIG =================
export const options = {
  scenarios: {
    rate_limit_test: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 request per detik
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 100,
      maxVUs: 200,
    },
  },

  thresholds: {
    checks: ['rate>0.99'], // semua response harus valid (200/429)
    rate_limit_ratio: ['avg>0.2'], // minimal 20% kena rate limit
  },
};

// ================= SETUP =================
export function setup() {
  const token = login();
  return { token };
}

// ================= TEST =================
export default function (data) {
  const headers = generateHeaders(data.token);

  const res = http.get(
    `${BASE_URL_FIELD}/api/v1/field/pagination?page=1&limit=10`,
    { headers }
  );

  const isSuccess = res.status === 200;
  const isRateLimited = res.status === 429;

  // ================= CHECK =================
  check(res, {
    'valid response (200 or 429)': (r) =>
      r.status === 200 || r.status === 429,
  });

  // ================= METRICS =================
  if (isSuccess) {
    successReq.add(1);
  }

  if (isRateLimited) {
    rateLimited.add(1);
    // console.log(`Rate limit triggered at ${new Date().toISOString()}`);
  }

  // ratio (1 = kena limit, 0 = tidak)
  rateLimitRatio.add(isRateLimited ? 1 : 0);
}