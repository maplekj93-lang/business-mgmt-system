import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    const sql = fs.readFileSync(path.resolve(process.cwd(), 'scripts', 'import_2026_data.sql'), 'utf8');
    try {
        await client.connect();
        await client.query(sql);
        console.log('Successfully executed import_2026_data.sql');
    } catch (e) {
        console.error('Error executing SQL:', e);
    } finally {
        await client.end();
    }
}

run();
