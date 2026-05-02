import crypto from 'k6/crypto';

const SERVICE_NAME = 'field-service';
const SIGNATURE_KEY = 'ZmllbGQtc2VydmljZQ==';

export function generateHeaders(token) {
  const requestAt = new Date().toISOString();

  const validateKey = `${SERVICE_NAME}:${SIGNATURE_KEY}:${requestAt}`;
  const hash = crypto.sha256(validateKey, 'hex');

  return {
    'x-service-name': SERVICE_NAME,
    'x-request-at': requestAt,
    'x-api-key': hash,
    Authorization: `Bearer ${token}`,
  };
}