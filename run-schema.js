const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

// Create Supabase client with service role key (has admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Parse the Supabase URL to get connection details
const url = new URL(supabaseUrl);
const projectRef = url.hostname.split('.')[0];

console.log('🚀 JobSight Pro Schema Deployment');
console.log('=====================================');
console.log(`📍 Target: ${projectRef}.supabase.co`);
console.log('📄 Source: scripts/schema.sql');
console.log('\n⚠️  IMPORTANT: This script requires manual execution of SQL statements.');
console.log('Please follow these steps to apply the schema changes:\n');

async function displayInstructions() {
    try {
        console.log('📋 DEPLOYMENT INSTRUCTIONS:');
        console.log('============================\n');

        console.log('1. 🌐 Open your Supabase Dashboard:');
        console.log(`   https://supabase.com/dashboard/project/${projectRef}`);

        console.log('\n2. 📊 Navigate to SQL Editor:');
        console.log('   Click "SQL Editor" in the left sidebar');

        console.log('\n3. 📝 Create New Query:');
        console.log('   Click "New Query" or "+" button');

        console.log('\n4. 📋 Copy Schema Content:');
        console.log('   Copy the entire contents of scripts/schema.sql');

        console.log('\n5. ▶️  Execute the Schema:');
        console.log('   Paste the SQL and click "Run" or press Ctrl+Enter');

        console.log('\n6. ✅ Verify Deployment:');
        console.log('   Check that all tables and constraints are created successfully');

        console.log('\n🔧 WHAT THIS DEPLOYMENT INCLUDES:');
        console.log('===================================');
        console.log('✨ Enhanced tasks table with milestone_id field');
        console.log('🔗 60+ foreign key constraints for data integrity');
        console.log('📚 Projects → Milestones → Tasks hierarchy');
        console.log('🏢 Business-level data isolation');
        console.log('👤 Comprehensive user audit trails');
        console.log('⚡ Optimized indexes for performance');
        console.log('🛡️  Complete referential integrity');

        console.log('\n📁 SCHEMA FILE LOCATION:');
        console.log('=========================');
        const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
        console.log(`📄 ${schemaPath}`);

        // Verify file exists
        if (fs.existsSync(schemaPath)) {
            const stats = fs.statSync(schemaPath);
            console.log(`📏 File size: ${Math.round(stats.size / 1024)} KB`);
            console.log(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
        } else {
            console.log('❌ Schema file not found!');
            return;
        }

        console.log('\n🔄 ALTERNATIVE: Using Supabase CLI');
        console.log('===================================');
        console.log('If you have the Supabase CLI configured:');
        console.log('1. Save the schema as a migration file');
        console.log('2. Run: npx supabase db push');

        console.log('\n💡 TIP: After deployment, regenerate TypeScript types:');
        console.log('npx supabase gen types typescript --project-id your-project > src/types/supabase.ts');

        console.log('\n🎯 READY TO DEPLOY!');
        console.log('Follow the steps above to apply your enhanced schema.');

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

// Execute the instructions
displayInstructions();
