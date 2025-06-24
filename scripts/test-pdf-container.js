#!/usr/bin/env node

/**
 * Test script to verify PDF generation works in container environment
 * Run this script inside the container to test Puppeteer setup
 */

const puppeteer = require('puppeteer');

async function testPDFGeneration() {
    console.log('🧪 Testing PDF generation in container...');

    try {
        console.log('📁 Checking directories...');
        console.log('TMPDIR:', process.env.TMPDIR || '/tmp');
        console.log('PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR || 'default');

        console.log('🚀 Launching Chromium...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        console.log('📄 Creating page...');
        const page = await browser.newPage(); console.log('🎨 Setting test content...');
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Container PDF Test</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #2563eb; }
                    .success { color: #16a34a; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>PDF Generation Test</h1>
                <p class="success">✅ PDF generation is working in container!</p>
                <p>Generated at: ${new Date().toISOString()}</p>
                <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
            </body>
            </html>
        `, { waitUntil: 'networkidle0' });

        // Give the page some time to render
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('📋 Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        console.log('✅ Success! PDF generated successfully');
        console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);

        return { success: true, size: pdfBuffer.length };

    } catch (error) {
        console.error('❌ Error during PDF generation test:', error);
        return { success: false, error: error.message };
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testPDFGeneration()
        .then(result => {
            if (result.success) {
                console.log('🎉 Container PDF test passed!');
                process.exit(0);
            } else {
                console.log('💥 Container PDF test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testPDFGeneration };
