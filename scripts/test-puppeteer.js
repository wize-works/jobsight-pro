#!/usr/bin/env node

/**
 * Test script to verify Puppeteer PDF generation
 * Run this to test the new Puppeteer setup
 */

const puppeteer = require('puppeteer');

async function testPuppeteerPDF() {
    console.log('🧪 Testing Puppeteer PDF generation...');

    try {
        console.log('🚀 Launching Chromium with Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-default-apps',
                '--no-default-browser-check',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        console.log('📄 Creating page...');
        const page = await browser.newPage();

        console.log('🎨 Setting test content...');
        await page.setContent(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Puppeteer PDF Test</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #2563eb; }
                    .success { color: #16a34a; font-weight: bold; }
                    .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>PDF Generation Test with Puppeteer</h1>
                <p class="success">✅ PDF generation is working with Puppeteer!</p>
                <p>Generated at: ${new Date().toISOString()}</p>
                <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
                
                <div class="info">
                    <h2>Migration Success</h2>
                    <p>This PDF was generated using Puppeteer instead of Playwright.</p>
                    <ul>
                        <li>Simpler API</li>
                        <li>Smaller container size</li>
                        <li>Better Docker compatibility</li>
                        <li>Faster startup time</li>
                    </ul>
                </div>
            </body>
            </html>
        `, { waitUntil: 'networkidle0' }); console.log('📋 Generating PDF...');
        const pdfData = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        const pdfBuffer = Buffer.from(pdfData);

        console.log('🔒 Closing browser...');
        await browser.close();

        console.log('✅ Success! PDF generated successfully');
        console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);

        return { success: true, size: pdfBuffer.length };

    } catch (error) {
        console.error('❌ Error during Puppeteer PDF test:', error);
        return { success: false, error: error.message };
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testPuppeteerPDF()
        .then(result => {
            if (result.success) {
                console.log('🎉 Puppeteer PDF test passed!');
                console.log('🔄 Playwright to Puppeteer migration successful!');
                process.exit(0);
            } else {
                console.log('💥 Puppeteer PDF test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { testPuppeteerPDF };
