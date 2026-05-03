import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVerifyPhoneGuard } from './profile.controller';

test('verify-phone guard returns 403 when Firebase token uid does not match current user uid', () => {
  const result = evaluateVerifyPhoneGuard({
    decodedUid: 'firebase_uid_other_user',
    expectedFirebaseUid: 'urent_abc123',
    hasExistingPhoneOwner: false
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 403);
    assert.equal(result.message, 'Firebase token does not belong to the current user');
  }
});

test('verify-phone guard returns 409 when phone is linked to another account', () => {
  const result = evaluateVerifyPhoneGuard({
    decodedUid: 'urent_abc123',
    expectedFirebaseUid: 'urent_abc123',
    hasExistingPhoneOwner: true
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.status, 409);
    assert.equal(result.message, 'Phone number is already linked to another account');
  }
});

test('verify-phone guard returns ok when uid matches and phone is available', () => {
  const result = evaluateVerifyPhoneGuard({
    decodedUid: 'urent_abc123',
    expectedFirebaseUid: 'urent_abc123',
    hasExistingPhoneOwner: false
  });

  assert.deepEqual(result, { ok: true });
});
