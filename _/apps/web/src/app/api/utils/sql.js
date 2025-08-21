import { neon } from '@neondatabase/serverless';

const NullishQueryFunction = async () => {
  console.error(
    'No database connection string was provided to `neon()`. Set process.env.DATABASE_URL to connect to the database.',
  );
  return new Response('Internal Server Error', { status: 500 });
};

NullishQueryFunction.transaction = async () => {
  console.error(
    'No database connection string was provided to `neon()`. Set process.env.DATABASE_URL to connect to the database.',
  );
  return new Response('Internal Server Error', { status: 500 });
};

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : NullishQueryFunction;

export default sql;
