/**
 * Test script for PDF generation with media storage
 * 
 * This script can be run to test the new PDF generation functionality
 * that saves artifacts to Azure media storage instead of local storage.
 */

import { generatePdfDocumentWithGotenberg } from '@/app/actions/pdf-generation-gotenberg';

// Simple HTML content for testing
const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Test PDF Document</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .content { margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test PDF Generation</h1>
        <p>Generated on: ${new Date().toISOString()}</p>
    </div>
    <div class="content">
        <h2>Media Storage Integration</h2>
        <p>This PDF was generated using the new media storage integration that:</p>
        <ul>
            <li>Reduces local storage dependencies</li>
            <li>Saves PDFs to Azure Blob Storage</li>
            <li>Links documents to business entities</li>
            <li>Provides better artifact management</li>
        </ul>
        <h2>Technical Details</h2>
        <p>The PDF generation process now:</p>
        <ol>
            <li>Calls Gotenberg service for PDF generation</li>
            <li>Generates PDF in memory</li>
            <li>Uploads buffer directly to Azure storage</li>
            <li>Creates media record with metadata</li>
            <li>Links to appropriate business entities</li>
        </ol>
    </div>
</body>
</html>
`;

/**
 * Test PDF generation functionality
 */
export async function testPdfGeneration() {
    console.log('Testing PDF generation with media storage...');

    try {
        const result = await generatePdfDocumentWithGotenberg({
            html: testHtml,
            filename: `test-pdf-${Date.now()}.pdf`,
            description: 'Test PDF generated for media storage verification',
            saveToStorage: true
        });

        if (result.success) {
            console.log('✅ PDF generation successful!');
            console.log('📄 File URL:', result.fileUrl);
            console.log('📊 Media record:', result.media?.id);
            console.log('📏 File size:', result.size, 'bytes');
            return true;
        } else {
            console.error('❌ PDF generation failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        return false;
    }
}

/**
 * Test client PDF generation
 */
export async function testClientPdfGeneration(businessId: string, clientId: string, clientName: string) {
    console.log('Testing client PDF generation...');

    try {
        const { generateClientPdf } = await import('@/app/actions/pdf-generation-gotenberg');

        const result = await generateClientPdf(businessId, clientId, clientName);

        if (result.success) {
            console.log('✅ Client PDF generation successful!');
            console.log('📄 File URL:', result.fileUrl);
            console.log('📊 Media record:', result.media?.id);
            console.log('📏 File size:', result.size, 'bytes');
            return true;
        } else {
            console.error('❌ Client PDF generation failed:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Client PDF test failed:', error);
        return false;
    }
}

// Export for use in other test files
export { testHtml };
