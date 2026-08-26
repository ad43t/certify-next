const USER_SEARCH_LIMIT = 25;
const USER_SEARCH_LENGTH_LIMIT = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ValidationUnauthorizedError extends Error {
  constructor() {
    super('Authentication is required to validate a user.');
    this.name = 'ValidationUnauthorizedError';
  }
}

function requireSignedInUser(session) {
  const userId = session?.user?.id;

  if (!userId) {
    throw new ValidationUnauthorizedError();
  }

  return userId;
}

/**
 * Return the small, non-sensitive user shape used by the validation picker.
 */
export async function findActiveValidationUsers({ database, session, query }) {
  requireSignedInUser(session);

  const searchTerm = String(query ?? '')
    .trim()
    .slice(0, USER_SEARCH_LENGTH_LIMIT);
  const users = await database.user.findMany({
    where: {
      is_active: true,
      ...(searchTerm
        ? {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    take: USER_SEARCH_LIMIT,
  });

  // Keep this boundary explicit as defense in depth if the data adapter changes.
  return users.map(({ id, name, email }) => ({ id, name, email }));
}

/**
 * Resolve an active target and only the active accreditations needed by the
 * validation results view.
 */
export async function findValidationResult({
  database,
  session,
  targetUserId,
}) {
  requireSignedInUser(session);

  if (!UUID_PATTERN.test(targetUserId)) {
    return null;
  }

  return database.user.findFirst({
    where: {
      id: targetUserId,
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      owned_accreditations: {
        where: {
          is_active: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          valid_on: true,
          valid_until: true,
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ valid_on: 'desc' }, { name: 'asc' }],
      },
    },
  });
}

/**
 * Resolve one active accreditation owned by an active validation target.
 * Scoping by both IDs prevents a detail URL from crossing into another user.
 */
export async function findValidationAccreditation({
  database,
  session,
  targetUserId,
  accreditationId,
}) {
  requireSignedInUser(session);

  if (!UUID_PATTERN.test(targetUserId) || !UUID_PATTERN.test(accreditationId)) {
    return null;
  }

  return database.accreditation.findFirst({
    where: {
      id: accreditationId,
      owner_id: targetUserId,
      is_active: true,
      owner: {
        is: {
          is_active: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      valid_on: true,
      valid_until: true,
      created_on: true,
      creator: {
        select: {
          name: true,
        },
      },
      owner: {
        select: {
          name: true,
        },
      },
    },
  });
}
