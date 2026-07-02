import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

import { login } from '../utils/auth.js';
import { generateHeaders } from '../utils/header-field-service.js';

// metric custom
const successReq = new Counter('success_requests');
const failedReq = new Counter('failed_requests');
const durationTrend = new Trend('request_duration');

const BASE_URL = 'http://localhost:8002';

export const options = {
  scenarios: {
    circuit_breaker_test: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '20s', target: 20 },  // normal traffic
        { duration: '30s', target: 100 }, // spike (trigger failure)
        { duration: '20s', target: 0 },   // cooldown (biar CB reset)
        { duration: '20s', target: 20 },  // recovery test
      ],
    },
  },
};

export function setup() {
  const token = login();
  return { token };
}

export default function (data) {
  const headers = generateHeaders(data.token);

  const res = http.get(
    `${BASE_URL}/api/v1/field/circuit-breaker-test`,
    { headers }
  );

  const isSuccess = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  durationTrend.add(res.timings.duration);

  if (isSuccess) {
    successReq.add(1);
  } else {
    failedReq.add(1);
  }

  sleep(1);
}