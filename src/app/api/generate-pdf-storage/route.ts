import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import { uploadPdfBuffer } from '@/app/actions/media';
import { linkExistingMediaToClient } from '@/app/actions/media';

export async function POST(request: NextRequest) {
    try {
        const {
            url,
            html,
            filename = 'document.pdf',
            businessId,
            clientId,
            description = "Generated PDF document",
            saveToStorage = true,
            returnAsAttachment = false
        } = await request.json();

        if (!url && !html) {
            return NextResponse.json({ error: 'Either URL or HTML content is required' }, { status: 400 });
        }

        if (saveToStorage && !businessId) {
            return NextResponse.json({ error: 'businessId is required when saveToStorage is true' }, { status: 400 });
        }        // Launch browser with Docker-optimized arguments based on Playwright official docs
        const browser = await chromium.launch({
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

        let pdfBuffer: Buffer;

        try {
            const context = await browser.newContext({
                ignoreHTTPSErrors: true,
                bypassCSP: true,
            });
            const page = await context.newPage();

            // Set page cache to disabled to prevent local storage usage
            await page.route('**/*', route => {
                const headers = {
                    ...route.request().headers(),
                    'cache-control': 'no-cache, no-store, must-revalidate',
                    'pragma': 'no-cache',
                    'expires': '0'
                };
                route.continue({ headers });
            });

            try {
                if (html) {
                    // Set HTML content directly
                    await page.setContent(html, { waitUntil: 'networkidle' });
                } else {
                    // Navigate to the URL
                    await page.goto(url, { waitUntil: 'networkidle' });
                }

                // Wait for the page to fully load
                await page.waitForTimeout(2000);

                // Generate PDF as buffer
                const pdfData = await page.pdf({
                    format: 'A4',
                    printBackground: true,
                    margin: {
                        top: '20px',
                        bottom: '20px',
                        left: '20px',
                        right: '20px'
                    }
                });

                pdfBuffer = Buffer.from(pdfData);
            } finally {
                // Ensure cleanup
                await page.close();
                await context.close();
            }
        } finally {
            await browser.close();
        }

        // If saveToStorage is enabled, upload to media storage
        if (saveToStorage) {
            const uploadResult = await uploadPdfBuffer(
                businessId,
                pdfBuffer,
                filename,
                description
            );

            if (!uploadResult.success) {
                return NextResponse.json(
                    {
                        error: 'Failed to save PDF to storage',
                        details: uploadResult.error
                    },
                    { status: 500 }
                );
            }

            // Link to client if clientId is provided
            if (clientId && uploadResult.media) {
                try {
                    await linkExistingMediaToClient(businessId, [uploadResult.media.id], clientId);
                } catch (error) {
                    console.error('Failed to link PDF to client:', error);
                    // Don't fail the request if linking fails
                }
            }

            // Return media information
            return NextResponse.json({
                success: true,
                media: uploadResult.media,
                fileUrl: uploadResult.fileUrl,
                filename: filename,
                size: pdfBuffer.length
            });
        }

        // If not saving to storage, return as before
        if (returnAsAttachment) {
            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Content-Length': pdfBuffer.length.toString(),
                },
            });
        } else {
            return NextResponse.json({
                success: true,
                filename: filename,
                pdf: pdfBuffer.toString('base64'),
                size: pdfBuffer.length
            });
        }
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
