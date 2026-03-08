/**
 * Re-link uploads folder files to properties when DB has empty photos/brochure/floorPlan
 * but files exist on disk. Matches by file mtime to property updatedAt (within time window).
 *
 * Usage: node src/link_uploads_to_properties.js [uploadsDir]
 *   uploadsDir defaults to backend/uploads (relative to this script).
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.sqlite');
const customUploads = process.argv[2];
const UPLOADS_BASE = customUploads ? path.resolve(customUploads) : path.resolve(__dirname, '../uploads');
const TIME_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours before/after property updatedAt

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

async function main() {
    const properties = await query(db, 'SELECT id, propertyName, updatedAt, photos, brochure, floorPlan FROM Properties');
    const files = getFilesWithMtime(UPLOADS_BASE);

    console.log('Properties:', properties.length, '| Files in uploads:', files.length);

    // Parse updatedAt to ms (SQLite stores ISO or datetime)
    for (const p of properties) {
        const d = p.updatedAt ? new Date(p.updatedAt) : null;
        p.updatedAtMs = d && !isNaN(d.getTime()) ? d.getTime() : 0;
        p.photos = parseJson(p.photos);
        p.brochure = parseJson(p.brochure);
        p.floorPlan = parseJson(p.floorPlan);
    }

    // Sort by updatedAt desc so we assign files to most recently updated properties first
    properties.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    files.sort((a, b) => b.mtimeMs - a.mtimeMs);

    let linked = 0;
    const usedPaths = new Set();

    for (const file of files) {
        if (usedPaths.has(file.path)) continue;
        const isPdf = file.ext === '.pdf';
        const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(file.ext);

        // Find best property: updated within TIME_WINDOW_MS of file mtime, with empty or minimal media
        let best = null;
        let bestScore = -1;
        for (const p of properties) {
            const dt = Math.abs(p.updatedAtMs - file.mtimeMs);
            if (dt > TIME_WINDOW_MS) continue;
            const score = -dt;
            if (score <= bestScore) continue;
            if (isPdf) {
                const hasRoom = p.brochure.length === 0 || p.floorPlan.length === 0;
                if (hasRoom) best = p;
            } else if (isImage) {
                if (p.photos.length < 20) best = p;
            }
            if (best === p) bestScore = score;
        }
        if (!best) continue;

        const updates = [];
        const params = [];

        if (isPdf) {
            if (best.brochure.length === 0) {
                best.brochure = [...best.brochure, file.path];
            } else if (best.floorPlan.length === 0) {
                best.floorPlan = [...best.floorPlan, file.path];
            } else continue;
        } else if (isImage) {
            best.photos = [...best.photos, file.path];
        }

        // Always write all three media columns so we don't overwrite previous updates to same property
        updates.push('photos = ?', 'brochure = ?', 'floorPlan = ?');
        params.push(JSON.stringify(best.photos), JSON.stringify(best.brochure), JSON.stringify(best.floorPlan), best.id);
        await run(db, `UPDATE Properties SET ${updates.join(', ')} WHERE id = ?`, params);
        usedPaths.add(file.path);
        linked++;
        console.log('[LINK]', file.path, '->', best.propertyName);
    }

    console.log('Linked', linked, 'files to properties.');
    db.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
