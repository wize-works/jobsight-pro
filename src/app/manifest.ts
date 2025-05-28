import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'JobSight Pro',
        short_name: 'JobSight',
        description: 'All your construction management needs in one place.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAFAF9',
        theme_color: '#F87431',
        icons: [
            {
                src: '/favicon-196x196.png',
                sizes: '196x196',
                type: 'image/png',
            }
        ],
    }
}