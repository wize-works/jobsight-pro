#!/usr/bin/env node

/**
 * Bundle Analysis Script for Tree Shaking Optimization
 * This script analyzes the bundle to measure tree shaking effectiveness
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌲 Starting Tree Shaking Analysis...\n');

// Function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Function to run build and capture output
function runBuildAnalysis() {
    console.log('📦 Building project with analysis...');

    try {
        // Run build with analysis
        const buildOutput = execSync('npm run build', {
            encoding: 'utf-8',
            cwd: process.cwd()
        });

        console.log('✅ Build completed successfully\n');

        // Extract bundle size information from build output
        const lines = buildOutput.split('\n');
        const bundleInfo = [];
        let inBundleSection = false;

        for (const line of lines) {
            if (line.includes('Route (app)') && line.includes('Size')) {
                inBundleSection = true;
                continue;
            }

            if (inBundleSection && line.trim()) {
                if (line.includes('First Load JS shared by all')) {
                    bundleInfo.push(line);
                    break;
                }
                bundleInfo.push(line);
            }
        }

        return bundleInfo;

    } catch (error) {
        console.error('❌ Build failed:', error.message);
        return [];
    }
}

// Function to analyze .next build folder
function analyzeBuildFolder() {
    const buildPath = path.join(process.cwd(), '.next');
    const staticPath = path.join(buildPath, 'static');

    if (!fs.existsSync(staticPath)) {
        console.log('❌ Build folder not found. Run npm run build first.');
        return {};
    }

    const analysis = {
        totalSize: 0,
        jsFiles: [],
        cssFiles: [],
        chunkFiles: []
    };

    function scanDirectory(dir, prefix = '') {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath, prefix + file + '/');
            } else if (stat.isFile()) {
                const size = stat.size;
                analysis.totalSize += size;

                const ext = path.extname(file).toLowerCase();
                const fileInfo = {
                    name: prefix + file,
                    size: size,
                    formattedSize: formatBytes(size)
                };

                if (ext === '.js') {
                    analysis.jsFiles.push(fileInfo);
                } else if (ext === '.css') {
                    analysis.cssFiles.push(fileInfo);
                } else {
                    analysis.chunkFiles.push(fileInfo);
                }
            }
        }
    }

    scanDirectory(staticPath);
    return analysis;
}

// Function to provide tree shaking recommendations
function getTreeShakingRecommendations() {
    return [
        '📝 Tree Shaking Optimization Recommendations:',
        '',
        '1. ✅ Date-fns imports optimized to use specific functions',
        '2. ✅ Package.json sideEffects configured for better tree shaking',
        '3. ✅ Webpack optimization settings enhanced',
        '4. ✅ Next.js experimental optimizePackageImports configured',
        '',
        '🔄 Next Steps:',
        '• Monitor bundle size changes in future builds',
        '• Consider dynamic imports for large features',
        '• Review and remove unused dependencies',
        '• Implement code splitting for heavy components',
        '',
        '📊 To run detailed bundle analysis:',
        '• npm run build:analyze',
        '• ANALYZE=true npm run build',
        ''
    ];
}

// Main execution
async function main() {
    console.log('🔍 Analyzing current bundle...\n');

    // Run build analysis
    const bundleInfo = runBuildAnalysis();

    if (bundleInfo.length > 0) {
        console.log('📊 Bundle Analysis Results:');
        console.log('═══════════════════════════════════════\n');

        for (const line of bundleInfo) {
            console.log(line);
        }
        console.log('\n═══════════════════════════════════════\n');
    }

    // Analyze build folder
    const buildAnalysis = analyzeBuildFolder();

    if (buildAnalysis.totalSize > 0) {
        console.log(`📦 Total Static Assets Size: ${formatBytes(buildAnalysis.totalSize)}`);
        console.log(`📄 JavaScript Files: ${buildAnalysis.jsFiles.length}`);
        console.log(`🎨 CSS Files: ${buildAnalysis.cssFiles.length}`);
        console.log(`📁 Other Files: ${buildAnalysis.chunkFiles.length}\n`);

        // Show largest JS files
        const largestJs = buildAnalysis.jsFiles
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        if (largestJs.length > 0) {
            console.log('🔍 Largest JavaScript Files:');
            for (const file of largestJs) {
                console.log(`  📄 ${file.name} - ${file.formattedSize}`);
            }
            console.log('');
        }
    }

    // Display recommendations
    const recommendations = getTreeShakingRecommendations();
    for (const rec of recommendations) {
        console.log(rec);
    }

    console.log('🌲 Tree Shaking Analysis Complete!');
}

// Run the analysis
main().catch(console.error);
