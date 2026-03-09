import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function restore() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(process.cwd(), 'insert_txs_final.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Extract the content inside BEGIN ... END;
        const match = sqlContent.match(/BEGIN([\s\S]*)END;/);
        if (!match) {
            console.error('Could not find BEGIN...END block');
            return;
        }

        let internalSql = match[1];

        // The script starts with a DELETE statement. Let's make sure it's at the top.
        // However, the original script has it.

        // We can split by "v_asset_id :=" to get blocks of transaction inserts.
        // Each block looks like:
        // v_asset_id := ...;
        // v_category_id := ...;
        // IF v_category_id IS NULL THEN ... END IF;
        // INSERT INTO ...;

        const blocks = internalSql.split(/(?=v_asset_id :=)/);

        console.log(`Found ${blocks.length} blocks`);

        // First block might contain the DELETE statement
        const firstBlock = blocks[0];
        if (firstBlock.includes('DELETE FROM public.transactions')) {
            console.log('Executing initial DELETE...');
            await client.query(`DO $$ DECLARE v_user_id uuid := '${process.env.v_user_id || '7b5b7208-f4cf-4103-8b39-fe6285357634'}'; v_asset_id uuid; v_category_id integer; BEGIN ${firstBlock} END; $$`);
        }

        const batchSize = 50;
        for (let i = 1; i < blocks.length; i += batchSize) {
            const batch = blocks.slice(i, i + batchSize).join('\n');
            console.log(`Executing batch ${Math.floor(i / batchSize) + 1}...`);

            const wrappedSql = `
        DO $$ 
        DECLARE 
          v_user_id uuid := '7b5b7208-f4cf-4103-8b39-fe6285357634'; 
          v_asset_id uuid; 
          v_category_id integer; 
        BEGIN 
          ${batch} 
        END; $$
      `;

            await client.query(wrappedSql);
        }

        console.log('Restoration complete!');

        const countRes = await client.query('SELECT COUNT(*) FROM public.transactions');
        console.log(`Total transactions: ${countRes.rows[0].count}`);

    } catch (err) {
        console.error('Error during restoration:', err);
    } finally {
        await client.end();
    }
}

restore();
