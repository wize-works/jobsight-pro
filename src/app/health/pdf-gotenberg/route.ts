import { NextResponse } from 'next/server';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg-service:3000';

export async function GET() {
    try {
        // Test basic PDF generation capability with Gotenberg
        const testHtml = '<html><body><h1>Health Check</h1><p>PDF generation test with Gotenberg</p></body></html>';

        const formData = new FormData();
        formData.append('files', new Blob([testHtml], { type: 'text/html' }), 'index.html');
        formData.append('paperWidth', '8.27');
        formData.append('paperHeight', '11.7');

        const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Gotenberg health check failed: ${response.statusText}`);
        }

        const pdfBuffer = Buffer.from(await response.arrayBuffer());

        return NextResponse.json({
            status: 'healthy',
            pdf_generation: 'working',
            service: 'gotenberg',
            pdf_size: pdfBuffer.length,
            timestamp: new Date().toISOString(),
            environment: {
                node_env: process.env.NODE_ENV,
                gotenberg_url: GOTENBERG_URL,
            }
        });

    } catch (error) {
        console.error('PDF health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            pdf_generation: 'failed',
            service: 'gotenberg',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            environment: {
                node_env: process.env.NODE_ENV,
                gotenberg_url: GOTENBERG_URL,
            }
        }, { status: 500 });
    }
}
