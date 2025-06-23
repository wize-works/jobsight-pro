import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

export async function POST(request: NextRequest) {
    try {
        const { url, html, filename = 'document.pdf', returnAsAttachment = true } = await request.json();

        if (!url && !html) {
            return NextResponse.json({ error: 'Either URL or HTML content is required' }, { status: 400 });
        }

        // Launch browser and generate PDF
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        if (html) {
            // Set HTML content directly
            await page.setContent(html, { waitUntil: 'networkidle' });
        } else {
            // Navigate to the URL
            await page.goto(url, { waitUntil: 'networkidle' });
        }

        // Wait for the page to fully load
        await page.waitForTimeout(2000);

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

        // If this is for email attachment, return as base64 JSON
        if (!returnAsAttachment) {
            return NextResponse.json({
                success: true,
                filename: filename,
                pdf: pdfBuffer.toString('base64'),
                size: pdfBuffer.length
            });
        }

        // Return PDF as response with appropriate headers for download
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
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
