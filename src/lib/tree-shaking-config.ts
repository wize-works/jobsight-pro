// Tree Shaking Configuration and Monitoring Utilities
// This file provides utilities to analyze and optimize bundle size

export interface BundleAnalysis {
    moduleName: string;
    size: number;
    isTreeShakeable: boolean;
    unusedExports: string[];
    recommendations: string[];
}

export const TREE_SHAKEABLE_MODULES = [
    'date-fns',
    'lodash',
    'react-icons',
    '@supabase/supabase-js',
    'recharts',
    'chart.js',
    'react-chartjs-2',
    'zod',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
] as const;

export const NON_TREE_SHAKEABLE_MODULES = [
    'react',
    'react-dom',
    'next',
    '@clerk/nextjs',
    'stripe',
    'openai',
] as const;

export const IMPORT_OPTIMIZATION_MAP = {
    'date-fns': {
        format: 'date-fns/format',
        formatDistance: 'date-fns/formatDistance',
        formatDistanceToNow: 'date-fns/formatDistanceToNow',
        set: 'date-fns/set',
        formatDate: 'date-fns', // This is exported from main module
    },
    'react-icons': {
        // Use specific icon packs instead of main export
        fa: 'react-icons/fa',
        md: 'react-icons/md',
        fi: 'react-icons/fi',
        hi: 'react-icons/hi',
        ai: 'react-icons/ai',
    },
    'lodash': {
        // Individual lodash functions
        debounce: 'lodash/debounce',
        throttle: 'lodash/throttle',
        isEqual: 'lodash/isEqual',
        merge: 'lodash/merge',
        pick: 'lodash/pick',
        omit: 'lodash/omit',
    },
} as const;

/**
 * Analyzes a module for tree shaking potential
 */
export function analyzeModuleTreeShaking(moduleName: string): BundleAnalysis {
    const isTreeShakeable = TREE_SHAKEABLE_MODULES.includes(moduleName as any);

    const recommendations: string[] = [];

    if (isTreeShakeable) {
        recommendations.push(`Use specific imports from ${moduleName} instead of default imports`);

        if (IMPORT_OPTIMIZATION_MAP[moduleName as keyof typeof IMPORT_OPTIMIZATION_MAP]) {
            recommendations.push(`Consider using sub-path imports for ${moduleName}`);
        }
    } else {
        recommendations.push(`${moduleName} is not tree-shakeable - consider alternatives if bundle size is critical`);
    }

    return {
        moduleName,
        size: 0, // Would be populated by actual bundle analysis
        isTreeShakeable,
        unusedExports: [], // Would be populated by actual analysis
        recommendations,
    };
}

/**
 * Webpack plugin configuration for enhanced tree shaking
 */
export const treeShakingWebpackConfig = {
    optimization: {
        usedExports: true,
        sideEffects: false,
        innerGraph: true,
        concatenateModules: true,
        // More aggressive tree shaking
        providedExports: true,

        // Split chunks to improve tree shaking effectiveness
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                // Separate vendor chunks for better caching and tree shaking
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                },
                // Separate date-fns to optimize its tree shaking
                dateFns: {
                    test: /[\\/]node_modules[\\/]date-fns[\\/]/,
                    name: 'date-fns',
                    chunks: 'all',
                    priority: 20,
                },
                // Separate React ecosystem
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    chunks: 'all',
                    priority: 20,
                },
                // Icons and UI libraries
                icons: {
                    test: /[\\/]node_modules[\\/](react-icons|lucide-react)[\\/]/,
                    name: 'icons',
                    chunks: 'all',
                    priority: 15,
                },
            },
        },
    },

    // Module resolution optimizations
    resolve: {
        mainFields: ['es2015', 'module', 'main'],
        // Prefer ES modules for better tree shaking
        aliasFields: ['es2015', 'module'],
    },

    // Module rules for specific libraries
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [
                    /node_modules\/(date-fns|lodash|react-icons)/,
                ],
                sideEffects: false,
            },
            // Mark CSS imports as having side effects
            {
                test: /\.css$/,
                sideEffects: true,
            },
        ],
    },
};

/**
 * Recommended ESLint rules for tree shaking optimization
 */
export const treeShakingESLintRules = {
    rules: {
        // Warn about default imports from tree-shakeable libraries
        'no-restricted-imports': [
            'warn',
            {
                patterns: [
                    {
                        group: ['date-fns'],
                        message: 'Import specific functions from date-fns sub-modules for better tree shaking',
                    },
                    {
                        group: ['lodash'],
                        message: 'Import specific functions from lodash/* for better tree shaking',
                    },
                    {
                        group: ['react-icons'],
                        message: 'Import from specific icon packages (react-icons/fa, react-icons/md, etc.)',
                    },
                ],
            },
        ],

        // Prefer named imports over namespace imports
        'import/no-namespace': 'warn',

        // Ensure imports are used
        'import/no-unused-modules': 'warn',
    },
};

/**
 * Performance monitoring metrics for tree shaking effectiveness
 */
export interface TreeShakingMetrics {
    totalBundleSize: number;
    vendorBundleSize: number;
    treeShakedModules: string[];
    potentialSavings: number;
    recommendedOptimizations: string[];
}

/**
 * Generates a tree shaking report
 */
export function generateTreeShakingReport(): TreeShakingMetrics {
    // This would be populated by actual bundle analysis
    return {
        totalBundleSize: 0,
        vendorBundleSize: 0,
        treeShakedModules: [],
        potentialSavings: 0,
        recommendedOptimizations: [
            'Optimize date-fns imports to use sub-modules',
            'Consider code splitting for large components',
            'Review and remove unused dependencies',
            'Implement dynamic imports for heavy features',
        ],
    };
}
