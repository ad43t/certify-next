import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findActiveValidationUsers,
  findValidationAccreditation,
  findValidationResult,
  ValidationUnauthorizedError,
} from '../lib/validation.mjs';

const signedInSession = { user: { id: 'validator-id' } };
const targetUserId = '9e7b4ba2-c76b-4a0f-8030-e912375acf57';
const accreditationId = '35b8112f-0707-40f9-a178-5a424927a081';

test('user lookup requires authentication before querying the database', async () => {
  let queried = false;
  const database = {
    user: {
      findMany: async () => {
        queried = true;
      },
    },
  };

  await assert.rejects(
    findActiveValidationUsers({ database, session: null, query: '' }),
    ValidationUnauthorizedError,
  );
  assert.equal(queried, false);
});

test('user lookup selects active users and strips unrelated fields', async () => {
  let receivedQuery;
  const database = {
    user: {
      findMany: async (query) => {
        receivedQuery = query;
        return [
          {
            id: 'active-user-id',
            name: 'Active User',
            email: 'active@example.com',
            password: 'must-not-leave-the-service',
            role: 'admin',
          },
        ];
      },
    },
  };

  const users = await findActiveValidationUsers({
    database,
    session: signedInSession,
    query: ' active ',
  });

  assert.equal(receivedQuery.where.is_active, true);
  assert.deepEqual(receivedQuery.select, {
    id: true,
    name: true,
    email: true,
  });
  assert.deepEqual(users, [
    {
      id: 'active-user-id',
      name: 'Active User',
      email: 'active@example.com',
    },
  ]);
});

test('validation results require authentication', async () => {
  await assert.rejects(
    findValidationResult({
      database: { user: { findFirst: async () => null } },
      session: undefined,
      targetUserId,
    }),
    ValidationUnauthorizedError,
  );
});

test('validation results scope the target and accreditations to active records', async () => {
  let receivedQuery;
  const database = {
    user: {
      findFirst: async (query) => {
        receivedQuery = query;
        return { id: targetUserId, name: 'Target', owned_accreditations: [] };
      },
    },
  };

  const result = await findValidationResult({
    database,
    session: signedInSession,
    targetUserId,
  });

  assert.deepEqual(receivedQuery.where, {
    id: targetUserId,
    is_active: true,
  });
  assert.equal(receivedQuery.select.owned_accreditations.where.is_active, true);
  assert.deepEqual(
    receivedQuery.select.owned_accreditations.select.creator.select,
    { name: true },
  );
  assert.deepEqual(result.owned_accreditations, []);
});

test('a missing or inactive validation target resolves to null', async () => {
  const result = await findValidationResult({
    database: { user: { findFirst: async () => null } },
    session: signedInSession,
    targetUserId,
  });

  assert.equal(result, null);
});

test('detail lookup requires authentication and scopes both active records', async () => {
  let receivedQuery;
  const database = {
    accreditation: {
      findFirst: async (query) => {
        receivedQuery = query;
        return null;
      },
    },
  };

  await assert.rejects(
    findValidationAccreditation({
      database,
      session: null,
      targetUserId,
      accreditationId,
    }),
    ValidationUnauthorizedError,
  );

  const result = await findValidationAccreditation({
    database,
    session: signedInSession,
    targetUserId,
    accreditationId,
  });

  assert.deepEqual(receivedQuery.where, {
    id: accreditationId,
    owner_id: targetUserId,
    is_active: true,
    owner: { is: { is_active: true } },
  });
  assert.deepEqual(receivedQuery.select.creator, { select: { name: true } });
  assert.deepEqual(receivedQuery.select.owner, { select: { name: true } });
  assert.equal(result, null);
});

test('malformed validation IDs resolve unavailable without a database query', async () => {
  let queried = false;
  const database = {
    user: {
      findFirst: async () => {
        queried = true;
      },
    },
    accreditation: {
      findFirst: async () => {
        queried = true;
      },
    },
  };

  assert.equal(
    await findValidationResult({
      database,
      session: signedInSession,
      targetUserId: 'not-a-uuid',
    }),
    null,
  );
  assert.equal(
    await findValidationAccreditation({
      database,
      session: signedInSession,
      targetUserId,
      accreditationId: 'not-a-uuid',
    }),
    null,
  );
  assert.equal(queried, false);
});
