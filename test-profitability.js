// Quick test to verify the project profitability fix
const { getProjectProfitabilityData } = require('./src/app/actions/project-profitability.ts');

async function testProfitability() {
    try {
        // Use a sample business ID to test the query
        const testBusinessId = '123e4567-e89b-12d3-a456-426614174000';
        console.log('Testing project profitability data fetch...');

        const result = await getProjectProfitabilityData(testBusinessId);
        console.log('✅ Success! Query executed without errors');
        console.log('Result:', {
            projectCount: result.projects.length,
            summary: result.summary
        });

    } catch (error) {
        console.error('❌ Error occurred:', error.message);
        console.error('Full error:', error);
    }
}

testProfitability();
