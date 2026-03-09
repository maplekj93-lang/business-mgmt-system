import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbConfig = {
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
};

async function run() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions'");
        console.log("Transactions Columns:", res.rows.map(r => r.column_name));

        const assetsRes = await client.query("SELECT id, name, owner_type FROM public.assets");
        console.log("Assets:", assetsRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
