import sharp from 'sharp';

/**
 * Optimize and resize image for processing
 */
export async function optimizeImage(buffer) {
    try {
        return await sharp(buffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
    } catch (error) {
        throw new Error(`Image optimization failed: ${error.message}`);
    }
}

/**
 * Extract dominant colors from image
 */
export async function extractDominantColors(buffer, count = 5) {
    try {
        const { dominant } = await sharp(buffer).stats();

        // Convert RGB to hex
        const toHex = (r, g, b) =>
            '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        return [toHex(dominant.r, dominant.g, dominant.b)];
    } catch (error) {
        console.error('Color extraction error:', error);
        return [];
    }
}

/**
 * Validate image file
 */
export function validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!file) {
        throw new Error('No image file provided');
    }

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid image format. Allowed: JPEG, PNG, WebP');
    }

    if (file.size > maxSize) {
        throw new Error('Image too large. Maximum size: 10MB');
    }

    return true;
}

/**
 * Convert image buffer to base64 for OpenAI API
 */
export function imageToBase64(buffer) {
    return buffer.toString('base64');
}
