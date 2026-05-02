import http from 'k6/http';
import { sleep, check } from 'k6';

import { login } from '../utils/auth.js';
import { generateHeaders } from '../utils/header-field-service.js';

// constant
const BASE_URL_FIELD = 'http://localhost:8002';

// config
export const options = {
  scenarios: {
    steady_traffic: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
      exec: 'steadyTest',
    },

    spike_traffic: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '10s', target: 200 }, // spike naik cepat
        { duration: '30s', target: 200 }, // tahan spike
        { duration: '10s', target: 10 },  // turun lagi (ini recovery)
      ],
      exec: 'spikeTest',
    },
  },

  thresholds: {
    'http_req_duration{scenario:steady_traffic}': ['p(95)<300'], // 95% request harus < 300ms
    'http_req_duration{scenario:spike_traffic}': ['p(95)<800'], // 95% request harus < 800ms
  },
};

// setup
export function setup() {
  const token = login();
  return { token };
}

// steady test
export function steadyTest(data) {
  const headers = generateHeaders(data.token);

  const res = http.get(
      `${BASE_URL_FIELD}/api/v1/field`,
      { headers }
  );

  check(res, {
    'steady: status 200': (r) => r.status === 200,
  });

  sleep(1);  // untuk buat 50 rps
}

// spike test
export function spikeTest(data) {
  const headers = generateHeaders(data.token);

  const res = http.get(
      `${BASE_URL_FIELD}/api/v1/field`,
      { headers }
  );

  check(res, {
    'spike: status 200': (r) => r.status === 200,
  });

  sleep(0.5); // baut rps lebih agresif
}
