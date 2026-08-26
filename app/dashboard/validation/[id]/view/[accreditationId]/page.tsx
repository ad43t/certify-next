import Breadcrumbs from '@/components/ui/accreditations/breadcrumbs';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import {
  findValidationAccreditation,
  ValidationUnauthorizedError,
} from '@/lib/validation.mjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(value)
    : 'Not specified';
}

function formatType(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function Page({
  params,
}: {
  params: { id: string; accreditationId: string };
}) {
  let accreditation;

  try {
    accreditation = await findValidationAccreditation({
      database: prisma,
      session: await auth(),
      targetUserId: params.id,
      accreditationId: params.accreditationId,
    });
  } catch (error) {
    if (error instanceof ValidationUnauthorizedError) {
      redirect('/login');
    }

    throw error;
  }

  const resultsHref = `/dashboard/validation/${params.id}/view`;

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Validation', href: '/dashboard/validation' },
          { label: 'View Accreditations', href: resultsHref },
          {
            label: 'Accreditation Details',
            href: `${resultsHref}/${params.accreditationId}`,
            active: true,
          },
        ]}
      />
      {!accreditation ? (
        <section className="mt-6 rounded-lg bg-gray-50 p-6" role="status">
          <h1 className="text-xl font-semibold text-gray-900">
            Accreditation unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This accreditation is inactive, missing, or does not belong to the
            selected active user.
          </p>
          <Link
            href={resultsHref}
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Return to validation results
          </Link>
        </section>
      ) : (
        <article className="mt-6 max-w-3xl rounded-lg bg-gray-50 p-6">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {formatType(accreditation.type)}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">
              {accreditation.name}
            </h1>
            <p className="mt-3 text-gray-700">
              {accreditation.description || 'No description provided.'}
            </p>
          </div>
          <dl className="mt-6 grid gap-5 border-t border-gray-200 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {accreditation.owner.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created by</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {accreditation.creator.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valid from</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(accreditation.valid_on)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valid until</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {accreditation.valid_until
                  ? formatDate(accreditation.valid_until)
                  : 'No expiry'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created on</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDate(accreditation.created_on)}
              </dd>
            </div>
          </dl>
        </article>
      )}
    </main>
  );
}
