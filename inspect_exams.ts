import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: exams, error } = await supabase.from('exams').select('id, name, description, category, is_archived, icon');
  if (error) {
    console.error('Error fetching exams:', error);
    return;
  }
  console.log('--- ALL EXAMS IN DATABASE (ADMIN) ---');
  exams.forEach(e => {
    console.log(`ID: ${e.id}`);
    console.log(`Name: ${e.name}`);
    console.log(`Icon: ${e.icon}`);
    console.log(`Category: ${e.category}`);
    console.log(`Archived: ${e.is_archived}`);
    console.log(`Description: "${e.description ? e.description.substring(0, 100) : ''}"`);
    console.log('-------------------------');
  });
}

run();
