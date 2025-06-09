export const validateUrl = (url: string | null | undefined): string => {
    if (!url || url.trim() === '') {
        return '/placeholder.jpg'; // or whatever your placeholder image path is
    }
    try {
        new URL(url);
        return url;
    } catch {
        return '/placeholder.jpg';
    }
};