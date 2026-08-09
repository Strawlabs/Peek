/**
 * Unit tests for gateway proxy PII detection logic.
 *
 * These regexes are the same ones used in StateContext.tsx routeGatewayRequest
 * and in the v1-chat-completions Edge Function to flag PII in prompts.
 */
import { describe, it, expect } from 'vitest';

// ─── PII Detection Regexes (extracted from gateway logic) ────────────────────
const PII_REGEXES = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
};

describe('PII Detection — Email', () => {
  it('flags a plain email address', () => {
    expect(PII_REGEXES.email.test('Contact john.doe@example.com for details')).toBe(true);
  });

  it('flags email with sub-domain', () => {
    expect(PII_REGEXES.email.test('Send to admin@mail.corp.io')).toBe(true);
  });

  it('does not flag a string without @', () => {
    expect(PII_REGEXES.email.test('No email here just text')).toBe(false);
  });

  it('does not flag an incomplete email', () => {
    expect(PII_REGEXES.email.test('user@ is not valid')).toBe(false);
  });
});

describe('PII Detection — Credit Card', () => {
  it('flags a 16-digit card number', () => {
    expect(PII_REGEXES.creditCard.test('Card: 4111111111111111')).toBe(true);
  });

  it('flags a card with dashes', () => {
    expect(PII_REGEXES.creditCard.test('Card: 4111-1111-1111-1111')).toBe(true);
  });

  it('flags a card with spaces', () => {
    expect(PII_REGEXES.creditCard.test('Card: 4111 1111 1111 1111')).toBe(true);
  });

  it('does not flag a short number', () => {
    expect(PII_REGEXES.creditCard.test('Order #12345')).toBe(false);
  });
});

describe('PII Detection — SSN', () => {
  it('flags a valid SSN format', () => {
    expect(PII_REGEXES.ssn.test('SSN is 123-45-6789')).toBe(true);
  });

  it('does not flag a phone number', () => {
    expect(PII_REGEXES.ssn.test('Call 555-1234-567')).toBe(false);
  });

  it('does not flag an incomplete SSN', () => {
    expect(PII_REGEXES.ssn.test('Number: 12-34-5678')).toBe(false);
  });
});
