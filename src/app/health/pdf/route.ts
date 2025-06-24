import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET() {
    try {
        // Test basic PDF generation capability
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

        const page = await browser.newPage(); await page.setContent('<html><body><h1>Health Check</h1></body></html>');

        // Give page time to render
        await new Promise(resolve => setTimeout(resolve, 500));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        return NextResponse.json({
            status: 'healthy',
            pdf_generation: 'working',
            pdf_size: pdfBuffer.length,
            timestamp: new Date().toISOString(),
            environment: {
                node_env: process.env.NODE_ENV,
                puppeteer_cache_dir: process.env.PUPPETEER_CACHE_DIR,
                tmpdir: process.env.TMPDIR
            }
        });

    } catch (error) {
        console.error('PDF health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            pdf_generation: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(), environment: {
                node_env: process.env.NODE_ENV,
                puppeteer_cache_dir: process.env.PUPPETEER_CACHE_DIR,
                tmpdir: process.env.TMPDIR
            }
        }, { status: 500 });
    }
}
