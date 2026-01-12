import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

/**
 * Extract frames from video at evenly spaced intervals
 */
export async function extractFrames(videoPath, count = 5) {
    return new Promise((resolve, reject) => {
        const outputDir = path.join(__dirname, '../temp/frames');
        const frames = [];

        // Ensure temp directory exists
        fs.mkdir(outputDir, { recursive: true }).catch(() => { });

        // Get video duration first
        ffmpeg.ffprobe(videoPath, async (err, metadata) => {
            if (err) {
                return reject(new Error(`Failed to probe video: ${err.message}`));
            }

            const duration = metadata.format.duration;
            const interval = duration / (count + 1);

            let extractedCount = 0;

            for (let i = 1; i <= count; i++) {
                const timestamp = interval * i;
                const outputPath = path.join(outputDir, `frame_${Date.now()}_${i}.jpg`);

                try {
                    await new Promise((res, rej) => {
                        ffmpeg(videoPath)
                            .screenshots({
                                timestamps: [timestamp],
                                filename: path.basename(outputPath),
                                folder: outputDir,
                                size: '1024x?'
                            })
                            .on('end', () => {
                                frames.push(outputPath);
                                extractedCount++;
                                if (extractedCount === count) {
                                    resolve(frames);
                                }
                                res();
                            })
                            .on('error', rej);
                    });
                } catch (error) {
                    console.error(`Error extracting frame ${i}:`, error);
                }
            }

            if (extractedCount === 0) {
                reject(new Error('Failed to extract any frames'));
            }
        });
    });
}

/**
 * Validate video file
 */
export async function validateVideo(file) {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const maxDuration = 30; // 30 seconds

    if (!file) {
        throw new Error('No video file provided');
    }

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error('Invalid video format. Allowed: MP4, WebM, MOV');
    }

    if (file.size > maxSize) {
        throw new Error('Video too large. Maximum size: 50MB');
    }

    // Check duration
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.path, (err, metadata) => {
            if (err) {
                return reject(new Error('Failed to read video metadata'));
            }

            const duration = metadata.format.duration;
            if (duration > maxDuration) {
                return reject(new Error(`Video too long. Maximum duration: ${maxDuration} seconds`));
            }

            resolve(true);
        });
    });
}

/**
 * Clean up temporary files
 */
export async function cleanupTempFiles(paths) {
    for (const filePath of paths) {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`Failed to delete ${filePath}:`, error.message);
        }
    }
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            resolve({
                duration: metadata.format.duration,
                width: metadata.streams[0].width,
                height: metadata.streams[0].height,
                fps: eval(metadata.streams[0].r_frame_rate)
            });
        });
    });
}
