/**
 * Re-link uploads folder files to properties. Uses SESSION-BASED grouping:
 * files uploaded within 15 min of each other are treated as one "session" and
 * assigned to the single property whose updatedAt is closest to that session.
 * This keeps photos, brochure, and floor plan for one property together.
 *
 * Usage:
 *   node src/link_uploads_to_properties.js           # assign only to properties with empty media
 *   node src/link_uploads_to_properties.js --reset    # clear all media then re-link by session (fix wrong links)
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.sqlite');
const customUploads = process.argv[2] && process.argv[2] !== '--reset' ? process.argv[2] : null;
const RESET_MEDIA = process.argv.includes('--reset');
const UPLOADS_BASE = customUploads ? path.resolve(customUploads) : path.resolve(__dirname, '../uploads');
const SESSION_GAP_MS = 15 * 60 * 1000; // 15 min: files within this gap = same upload session
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // only consider properties updated in last 90 days (when matching sessions)

if (!fs.existsSync(UPLOADS_BASE)) {
    console.error('Uploads directory not found:', UPLOADS_BASE);
    process.exit(1);
}
if (!fs.existsSync(dbPath)) {
    console.error('Database not found:', dbPath);
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function query(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function parseJson(v) {
    if (!v || v === '[]') return [];
    try {
        return typeof v === 'string' ? JSON.parse(v) : v;
    } catch (_) {
        return [];
    }
}

function getFilesWithMtime(dir, basePath = '') {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        const rel = path.join(basePath, e.name);
        if (e.isDirectory()) {
            out.push(...getFilesWithMtime(full, rel));
        } else if (e.isFile()) {
            const ext = path.extname(e.name).toLowerCase();
            if (['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
                try {
                    const stat = fs.statSync(full);
                    out.push({
                        path: '/' + path.join('uploads', rel).replace(/\\/g, '/'),
                        mtimeMs: stat.mtimeMs,
                        ext,
                    });
                } catch (_) {}
            }
        }
    }
    return out;
}

/** Group files into upload sessions: consecutive files (by mtime) within SESSION_GAP_MS. */
function groupIntoSessions(files) {
    if (files.length === 0) return [];
    const sorted = [...files].sort((a, b) => a.mtimeMs - b.mtimeMs);
    const sessions = [];
    let current = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].mtimeMs - sorted[i - 1].mtimeMs <= SESSION_GAP_MS) {
            current.push(sorted[i]);
        } else {
            sessions.push(current);
            current = [sorted[i]];
        }
    }
    sessions.push(current);
    return sessions;
}

async function main() {
    if (RESET_MEDIA) {
        console.log('--reset: clearing all photos, brochure, floorPlan for all properties...');
        await run(db, "UPDATE Properties SET photos = '[]', brochure = '[]', floorPlan = '[]'");
    }

    const properties = await query(db, 'SELECT id, propertyName, updatedAt, photos, brochure, floorPlan FROM Properties');
    const files = getFilesWithMtime(UPLOADS_BASE);

    console.log('Properties:', properties.length, '| Files in uploads:', files.length);

    for (const p of properties) {
        const d = p.updatedAt ? new Date(p.updatedAt) : null;
        p.updatedAtMs = d && !isNaN(d.getTime()) ? d.getTime() : 0;
        p.photos = parseJson(p.photos);
        p.brochure = parseJson(p.brochure);
        p.floorPlan = parseJson(p.floorPlan);
    }

    const sessions = groupIntoSessions(files);
    console.log('Upload sessions (files within 15 min):', sessions.length);

    // Sort properties by updatedAt desc (most recently updated first)
    properties.sort((a, b) => b.updatedAtMs - a.updatedAtMs);

    let linkedCount = 0;
    const usedPaths = new Set();

    for (const session of sessions) {
        const sessionTimeMs = session.length ? session.reduce((s, f) => s + f.mtimeMs, 0) / session.length : 0;
        const images = session.filter((f) => ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(f.ext)).sort((a, b) => a.mtimeMs - b.mtimeMs);
        const pdfs = session.filter((f) => f.ext === '.pdf').sort((a, b) => a.mtimeMs - b.mtimeMs);

        // Find property whose updatedAt is closest to this session (within 90 days), with room for this session
        let best = null;
        let bestDt = Infinity;
        const now = Date.now();
        for (const p of properties) {
            if (p.updatedAtMs <= 0) continue;
            if (now - p.updatedAtMs > MAX_AGE_MS) continue; // skip very old properties for session match
            const dt = Math.abs(p.updatedAtMs - sessionTimeMs);
            const roomPhotos = p.photos.length + images.length <= 20;
            const roomPdf = p.brochure.length + p.floorPlan.length + pdfs.length <= 10; // allow a few PDFs per property
            if (!roomPhotos || !roomPdf) continue;
            if (dt < bestDt) {
                bestDt = dt;
                best = p;
            }
        }

        // Fallback: if no property in 90 days, use closest updatedAt overall (any age)
        if (!best) {
            for (const p of properties) {
                const dt = Math.abs(p.updatedAtMs - sessionTimeMs);
                const roomPhotos = p.photos.length + images.length <= 20;
                const roomPdf = p.brochure.length + p.floorPlan.length + pdfs.length <= 10;
                if (!roomPhotos || !roomPdf) continue;
                if (dt < bestDt) {
                    bestDt = dt;
                    best = p;
                }
            }
        }

        if (!best) continue;

        // Assign entire session to this property
        for (const f of images) {
            if (usedPaths.has(f.path)) continue;
            best.photos.push(f.path);
            usedPaths.add(f.path);
            linkedCount++;
        }
        for (let i = 0; i < pdfs.length; i++) {
            const f = pdfs[i];
            if (usedPaths.has(f.path)) continue;
            if (i % 2 === 0) best.brochure.push(f.path);
            else best.floorPlan.push(f.path);
            usedPaths.add(f.path);
            linkedCount++;
        }

        if (images.length > 0 || pdfs.length > 0) {
            await run(db, `UPDATE Properties SET photos = ?, brochure = ?, floorPlan = ? WHERE id = ?`, [
                JSON.stringify(best.photos),
                JSON.stringify(best.brochure),
                JSON.stringify(best.floorPlan),
                best.id,
            ]);
            console.log('[SESSION]', session.length, 'files ->', best.propertyName, '(photos +' + images.length + ', brochure/floor +' + pdfs.length + ')');
        }
    }

    console.log('Linked', linkedCount, 'files to properties (session-based).');
    db.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
