import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }        // Launch browser and generate PDF
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to the URL
        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for the page to fully load
        await page.waitForTimeout(1000);

        // Generate PDF as buffer instead of saving to file
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                bottom: '20px',
                left: '20px',
                right: '20px'
            }
        });

        await browser.close();

        // Return PDF as response with appropriate headers
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="invoice.pdf"',
                'Content-Length': pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: errorMessage,
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
