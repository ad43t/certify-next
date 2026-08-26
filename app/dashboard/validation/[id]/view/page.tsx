import Breadcrumbs from '@/components/ui/accreditations/breadcrumbs';
import ValidationTable from '@/components/ui/validation/table';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import {
  findValidationResult,
  ValidationUnauthorizedError,
} from '@/lib/validation.mjs';

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  let result;

  try {
    result = await findValidationResult({
      database: prisma,
      session: await auth(),
      targetUserId: id,
    });
  } catch (error) {
    if (error instanceof ValidationUnauthorizedError) {
      redirect('/login');
    }

    throw error;
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Validation', href: '/dashboard/validation' },
          {
            label: `View Accreditations`,
            href: `/dashboard/validation/${id}/view`,
            active: true,
          },
        ]}
      />
      {!result ? (
        <section className="mt-6 rounded-lg bg-gray-50 p-6" role="status">
          <h1 className="text-xl font-semibold text-gray-900">
            User unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This user does not exist or is no longer active.
          </p>
          <Link
            href="/dashboard/validation"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Choose another user
          </Link>
        </section>
      ) : result.owned_accreditations.length === 0 ? (
        <section className="mt-6 rounded-lg bg-gray-50 p-6" role="status">
          <h1 className="text-xl font-semibold text-gray-900">
            No active accreditations
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {result.name} does not have any active accreditations to validate.
          </p>
        </section>
      ) : (
        <>
          <h1 className="mt-6 text-xl font-semibold text-gray-900">
            Active accreditations for {result.name}
          </h1>
          <ValidationTable
            accreditations={result.owned_accreditations}
            userId={result.id}
          />
        </>
      )}
    </main>
  );
}
