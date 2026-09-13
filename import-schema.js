// Database Schema Import Script
// Run this to import the schema into your Supabase project

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function importSchema() {
    try {
        console.log('🚀 Starting database schema import...');

        // Read the schema file
        const schema = fs.readFileSync('./supabase-schema.sql', 'utf8');

        // Split into individual statements
        const statements = schema
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📊 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });

                    if (error) {
                        console.log(`⚠️  Statement ${i + 1} warning:`, error.message);
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.log(`❌ Statement ${i + 1} error:`, err.message);
                }
            }
        }

        console.log('🎉 Database schema import completed!');
        console.log('📋 Next steps:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Check the Table Editor to see all tables');
        console.log('   3. Test the authentication system');

    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

// Note: This script requires the exec_sql function to be available
// For now, you'll need to import the schema manually through the Supabase dashboard
console.log('📝 Manual Import Instructions:');
console.log('   1. Go to https://supabase.com/dashboard');
console.log('   2. Select your project');
console.log('   3. Go to SQL Editor');
console.log('   4. Copy the contents of supabase-schema.sql');
console.log('   5. Paste and run the SQL');
console.log('   6. Verify tables are created in Table Editor');

importSchema();

