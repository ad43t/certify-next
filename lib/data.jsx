'use server';
import { sql } from '@vercel/postgres';

import { formatCurrency } from './utils';

import { unstable_noStore as noStore } from 'next/cache';
import prisma from './prisma';

export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    const data = (await sql) < Revenue > `SELECT * FROM revenue`;
    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const data =
      (await sql) <
      LatestInvoiceRaw >
      `
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

import { auth } from '@/auth';

export async function fetchUsers() {
  try {
    const results_users = await prisma.user.findMany({});
    return results_users;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch accreusersditations.');
  }
}

export async function fetchNontransactedAccreditations() {
  try {
    // Get user from jwt
    const token = await auth();
    const idUser = token?.user?.id;
    console.log(idUser);
    const results_accred = await prisma.accreditation.findMany({
      where: {
        OR: [{ owner_id: idUser }, { creator_id: idUser }],
        AND: { last_transaction_status: { equals: null } },
      },
    });
    console.log(results_accred);
    return results_accred;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch accreditations.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredAccreditations(query, currentPage) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Get user from jwt
    const token = await auth();
    const idUser = token?.user?.id;

    // query for accreditations and filter by user
    const results_accred = await prisma.accreditation.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
          {
            OR: [
              {
                creator_id: {
                  equals: idUser,
                },
              },
              {
                owner_id: {
                  equals: idUser,
                },
              },
            ],
          },
        ],
      },
      include: {
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

    // query for user
    return results_accred;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch accreditations.');
  }
}

export async function fetchFilteredTransactions(query, currentPage) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    // Get user from jwt
    const token = await auth();
    const idUser = token?.user?.id;

    // query for accreditations and filter by user
    const results_trans = await prisma.transaction.findMany({
      where: {
        AND: [
          {
            OR: [
              { to_id: { equals: idUser } },
              { from_id: { equals: idUser } },
            ],
          },
          {
            accreditation: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      },
      include: {
        accreditation: {
          select: { name: true },
        },
        to: {
          select: { email: true },
        },
        from: {
          select: { email: true },
        },
      },
    });

    console.log(results_trans);

    // query for user
    return results_trans;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch transactions.');
  }
}

export async function fetchInvoicesPages(query) {
  noStore();
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchAccreditationById(id) {
  noStore();
  try {
    const data = await prisma.accreditation.findUnique({ where: { id: id } });

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch accreditation.');
  }
}

export async function fetchAccreditationTypes() {
  noStore();
  try {
    const result = await prisma.$queryRaw`
    SELECT enum_range(NULL::accreditation_type)
    `;

    return result[0].enum_range;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function getUser(email) {
  noStore();
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function getOptions(query) {
  try {
    const results = await prisma.user.findMany({
      where: {
        email: { contains: query, mode: 'insensitive' },
      },
    });

    console.log(results);
    return [];
  } catch (error) {
    console.error('Failed to fetch options:', error);
    throw new Error('Failed to fetch options.');
  }
}
