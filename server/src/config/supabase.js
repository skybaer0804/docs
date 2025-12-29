const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Service Role Key를 우선 사용 (RLS 우회), 없으면 Anon Key 사용
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Key is missing in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
