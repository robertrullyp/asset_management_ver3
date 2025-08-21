import { neon } from '@neondatabase/serverless';

const ERROR_MESSAGE =
  'No database connection string was provided to `neon()`. Set process.env.DATABASE_URL to connect to the database.';

const NullishQueryFunction = async () => {
  console.error(ERROR_MESSAGE);
  throw new Error(ERROR_MESSAGE);
};

NullishQueryFunction.transaction = async () => {
  console.error(ERROR_MESSAGE);
  throw new Error(ERROR_MESSAGE);
};

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : NullishQueryFunction;

export default sql;
