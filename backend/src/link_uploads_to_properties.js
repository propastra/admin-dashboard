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
const TIME_WINDOW_STRICT_MS = 2 * 60 * 60 * 1000;       // 2 hours - prefer same session
const TIME_WINDOW_LOOSE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days - fallback

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

    function hasRoomFor(p, isPdf, isImage) {
        if (isPdf) return p.brochure.length === 0 || p.floorPlan.length === 0;
        if (isImage) return p.photos.length < 20;
        return false;
    }

    function assignFileToProperty(file, best) {
        const isPdf = file.ext === '.pdf';
        const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(file.ext);
        if (isPdf) {
            if (best.brochure.length === 0) best.brochure = [...best.brochure, file.path];
            else if (best.floorPlan.length === 0) best.floorPlan = [...best.floorPlan, file.path];
            else return false;
        } else if (isImage) {
            best.photos = [...best.photos, file.path];
        }
        return true;
    }

    /** Find property with room for this file type; optionally within maxWindowMs (null = no limit). Prefer closest updatedAt to file mtime. */
    function findBest(file, maxWindowMs) {
        const isPdf = file.ext === '.pdf';
        const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(file.ext);
        let best = null;
        let bestDt = Infinity;
        for (const p of properties) {
            const dt = Math.abs(p.updatedAtMs - file.mtimeMs);
            if (maxWindowMs != null && dt > maxWindowMs) continue;
            if (!hasRoomFor(p, isPdf, isImage)) continue;
            if (dt < bestDt) {
                bestDt = dt;
                best = p;
            }
        }
        return best;
    }

    const unlinked = [];
    for (const file of files) {
        if (usedPaths.has(file.path)) continue;
        let best = findBest(file, TIME_WINDOW_STRICT_MS);
        if (!best) {
            unlinked.push(file);
            continue;
        }
        if (!assignFileToProperty(file, best)) continue;
        usedPaths.add(file.path);
        linked++;
        await run(db, `UPDATE Properties SET photos = ?, brochure = ?, floorPlan = ? WHERE id = ?`, [JSON.stringify(best.photos), JSON.stringify(best.brochure), JSON.stringify(best.floorPlan), best.id]);
        console.log('[LINK]', file.path, '->', best.propertyName);
    }

    for (const file of unlinked) {
        if (usedPaths.has(file.path)) continue;
        const best = findBest(file, TIME_WINDOW_LOOSE_MS);
        if (!best) continue;
        if (!assignFileToProperty(file, best)) continue;
        usedPaths.add(file.path);
        linked++;
        await run(db, `UPDATE Properties SET photos = ?, brochure = ?, floorPlan = ? WHERE id = ?`, [JSON.stringify(best.photos), JSON.stringify(best.brochure), JSON.stringify(best.floorPlan), best.id]);
        console.log('[LINK 30d]', file.path, '->', best.propertyName);
    }

    const stillUnlinked = unlinked.filter((f) => !usedPaths.has(f.path));
    for (const file of stillUnlinked) {
        const best = findBest(file, null);
        if (!best) continue;
        if (!assignFileToProperty(file, best)) continue;
        usedPaths.add(file.path);
        linked++;
        await run(db, `UPDATE Properties SET photos = ?, brochure = ?, floorPlan = ? WHERE id = ?`, [JSON.stringify(best.photos), JSON.stringify(best.brochure), JSON.stringify(best.floorPlan), best.id]);
        console.log('[LINK fallback]', file.path, '->', best.propertyName);
    }

    console.log('Linked', linked, 'files to properties.');
    db.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
