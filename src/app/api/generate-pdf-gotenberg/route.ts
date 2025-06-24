import { NextRequest, NextResponse } from 'next/server';

const GOTENBERG_URL = process.env.GOTENBERG_URL || 'http://gotenberg-service:3000';

export async function POST(request: NextRequest) {
    try {
        const { url, html, filename = 'document.pdf', returnAsAttachment = true } = await request.json();

        if (!url && !html) {
            return NextResponse.json({ error: 'Either URL or HTML content is required' }, { status: 400 });
        }

        let pdfBuffer: Buffer;

        if (html) {
            // For HTML content, use Gotenberg's HTML endpoint
            const formData = new FormData();
            formData.append('files', new Blob([html], { type: 'text/html' }), 'index.html');            // Set PDF options
            formData.append('paperWidth', '8.27');  // A4 width in inches
            formData.append('paperHeight', '11.7'); // A4 height in inches
            formData.append('marginTop', '0.5');
            formData.append('marginBottom', '0.5');
            formData.append('marginLeft', '0.5');
            formData.append('marginRight', '0.5');

            const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/html`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Gotenberg HTML conversion failed: ${response.statusText}`);
            }

            pdfBuffer = Buffer.from(await response.arrayBuffer());
        } else {
            // For URL, use Gotenberg's URL endpoint with form data
            const formData = new FormData();
            formData.append('url', url);
            formData.append('paperWidth', '8.27');
            formData.append('paperHeight', '11.7');
            formData.append('marginTop', '0.5');
            formData.append('marginBottom', '0.5');
            formData.append('marginLeft', '0.5');
            formData.append('marginRight', '0.5');

            const response = await fetch(`${GOTENBERG_URL}/forms/chromium/convert/url`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Gotenberg URL conversion failed: ${response.statusText}`);
            }

            pdfBuffer = Buffer.from(await response.arrayBuffer());
        }

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
        console.error('Error generating PDF with Gotenberg:', error);
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
