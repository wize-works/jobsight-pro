import { NextResponse } from 'next/server';

export async function GET() {
    try {        // Basic health check
        const health: {
            status: string;
            timestamp: string;
            version: string;
            environment: string; uptime: number;
            container?: {
                gotenberg_url: string | undefined;
                tmpdir: string;
            };
        } = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
        };

        // Check if we're in a container environment
        const isContainer = process.env.GOTENBERG_URL !== undefined;

        if (isContainer) {
            health.container = {
                gotenberg_url: process.env.GOTENBERG_URL,
                tmpdir: process.env.TMPDIR || '/tmp',
            };
        }

        return NextResponse.json(health);
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
