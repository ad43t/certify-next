import { ViewValidationAccreditation } from '@/components/ui/validation/buttons';

export type ValidationAccreditation = {
  id: string;
  name: string;
  description: string | null;
  valid_on: Date | string | null;
  valid_until: Date | string | null;
  type: string;
  creator: {
    name: string;
  };
};

export default async function ValidationTable({
  accreditations,
  userId,
}: {
  accreditations: ValidationAccreditation[];
  userId: string;
}) {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-x-auto rounded-lg bg-gray-50 p-2 md:pt-0">
          <table className="min-w-full text-gray-900">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Description
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Valid From
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Valid Until
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Type
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Created By
                </th>
                <th
                  scope="col"
                  className="relative flex justify-between py-3 pl-6 pr-3"
                >
                  <span className="font-large text-right">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {accreditations.map((accreditation) => (
                <tr
                  key={accreditation.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <p>{accreditation.name}</p>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <p>{accreditation.description}</p>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <p>
                      {accreditation.valid_on
                        ? new Date(accreditation.valid_on).toDateString()
                        : 'Not specified'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <p>
                      {accreditation.valid_until
                        ? new Date(accreditation.valid_until).toDateString()
                        : 'No expiry'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {accreditation.type}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3">
                    {accreditation.creator.name}
                  </td>
                  <td className="flex justify-between whitespace-nowrap py-3 pl-6 pr-3">
                    <ViewValidationAccreditation
                      userId={userId}
                      accreditationId={accreditation.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
