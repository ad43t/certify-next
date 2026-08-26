import Link from 'next/link';
import { CheckCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';

const primaryButtonClasses =
  'flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

export function ValidateUser({ userId }: { userId: string | null }) {
  if (!userId) {
    return (
      <button
        type="button"
        disabled
        className={`${primaryButtonClasses} cursor-not-allowed opacity-50`}
      >
        <span>Validate User</span>
        <CheckCircleIcon className="ml-2 h-5" />
      </button>
    );
  }

  return (
    <Link
      href={`/dashboard/validation/${userId}/view`}
      className={primaryButtonClasses}
    >
      <span>Validate User</span>
      <CheckCircleIcon className="ml-2 h-5" />
    </Link>
  );
}

export function ViewValidationAccreditation({
  userId,
  accreditationId,
}: {
  userId: string;
  accreditationId: string;
}) {
  return (
    <Link
      href={`/dashboard/validation/${userId}/view/${accreditationId}`}
      className="rounded-md border p-2 hover:bg-gray-100"
      aria-label="View accreditation details"
    >
      <DocumentIcon className="w-5" />
    </Link>
  );
}
