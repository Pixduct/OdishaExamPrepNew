import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: banks, error } = await supabase.from('questionBanks').select('id, title, type, target_mode, is_archived');
  if (error) {
    console.error('Error fetching question banks:', error);
    return;
  }
  console.log('--- QUESTION BANKS IN DATABASE ---');
  banks.forEach(b => {
    console.log(`ID: ${b.id}`);
    console.log(`Title: ${b.title}`);
    console.log(`Type: ${b.type}`);
    console.log(`Target Mode: ${b.target_mode}`);
    console.log(`Archived: ${b.is_archived}`);
    console.log('----------------------------------');
  });
}

run();
