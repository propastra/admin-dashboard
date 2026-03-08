const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

// Database configuration - Use absolute paths
const dbPath = path.resolve(__dirname, '../database.sqlite');
const backupDbPath = process.argv[2]; // Pass path to backup DB as arg

if (!backupDbPath || !fs.existsSync(backupDbPath)) {
    console.error('Usage: node restore_media.js <path_to_backup_sqlite>');
    process.exit(1);
}

console.log(`Target DB: ${dbPath}`);
console.log(`Backup DB: ${backupDbPath}`);

const targetDb = new sqlite3.Database(dbPath);
const backupDb = new sqlite3.Database(backupDbPath);

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
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

async function start() {
    try {
        // Check schemas
        const backupCols = (await query(backupDb, "PRAGMA table_info(Properties)")).map(c => c.name);
        const targetCols = (await query(targetDb, "PRAGMA table_info(Properties)")).map(c => c.name);
        
        console.log(`Backup columns: ${backupCols.join(', ')}`);
        
        const backupProperties = await query(backupDb, "SELECT * FROM Properties");
        console.log(`Found ${backupProperties.length} properties in backup.`);

        const targetProperties = await query(targetDb, "SELECT id, propertyName, projectName, dimensions, photos, brochure, floorPlan FROM Properties");

        let updatedCount = 0;
        let insertedCount = 0;
        
        for (const bp of backupProperties) {
            const bpName = (bp.propertyName || "").trim().toLowerCase();
            const bpDims = (bp.dimensions || "").trim().toLowerCase();
            
            if (!bpName) continue;

            // Strategy 0: Match by id first (best for same-DB backup)
            let match = targetProperties.find(tp => tp.id === bp.id);

            // Strategy 1: Exact Name + Dimensions Match (High Confidence)
            if (!match) {
                match = targetProperties.find(tp => 
                    (tp.propertyName || "").trim().toLowerCase() === bpName && 
                    (tp.dimensions || "").trim().toLowerCase() === bpDims
                );
            }

            // Strategy 2: Name match only
            if (!match) {
                match = targetProperties.find(tp => (tp.propertyName || "").trim().toLowerCase() === bpName);
            }

            if (match) {
                const updates = [];
                const params = [];
                const empty = (v) => !v || v === '[]' || (typeof v === 'string' && v.trim() === '[]');
                const parseJson = (v) => {
                    if (!v || v === '[]') return [];
                    try { return typeof v === 'string' ? JSON.parse(v) : v; } catch (_) { return []; }
                };
                const targetPhotos = parseJson(match.photos);
                const targetBrochure = parseJson(match.brochure);
                const targetFloorPlan = parseJson(match.floorPlan);

                // Prefer backup media when target is empty, or merge when backup has more
                if (backupCols.includes('photos') && targetCols.includes('photos')) {
                    const bpPhotos = parseJson(bp.photos);
                    if (bpPhotos.length > 0) {
                        const merged = targetPhotos.length === 0 ? bpPhotos : [...new Set([...targetPhotos, ...bpPhotos])];
                        if (merged.length > targetPhotos.length) {
                            updates.push("photos = ?");
                            params.push(JSON.stringify(merged));
                        }
                    }
                }
                if (backupCols.includes('brochure') && targetCols.includes('brochure') && bp.brochure && !empty(bp.brochure)) {
                    const bpBrochure = parseJson(bp.brochure);
                    const merged = targetBrochure.length === 0 ? bpBrochure : [...new Set([...targetBrochure, ...bpBrochure])];
                    if (merged.length > targetBrochure.length || targetBrochure.length === 0) {
                        updates.push("brochure = ?");
                        params.push(JSON.stringify(merged));
                    }
                }
                if (backupCols.includes('floorPlan') && targetCols.includes('floorPlan') && bp.floorPlan && !empty(bp.floorPlan)) {
                    const bpFloor = parseJson(bp.floorPlan);
                    const merged = targetFloorPlan.length === 0 ? bpFloor : [...new Set([...targetFloorPlan, ...bpFloor])];
                    if (merged.length > targetFloorPlan.length || targetFloorPlan.length === 0) {
                        updates.push("floorPlan = ?");
                        params.push(JSON.stringify(merged));
                    }
                }

                if (updates.length > 0) {
                    params.push(match.id);
                    await run(targetDb, `UPDATE Properties SET ${updates.join(', ')} WHERE id = ?`, params);
                    console.log(`[UPD] Restored media for: ${match.propertyName} (${match.id})`);
                    updatedCount++;
                }
            } else {
                // Strategy 3: INSERT if totally missing
                console.log(`[INS] Found manual/new property: ${bp.propertyName}. Inserting...`);
                
                // Map common columns that exist in BOTH
                const commonCols = backupCols.filter(c => targetCols.includes(c) && c !== 'id');
                const values = commonCols.map(c => bp[c]);
                const placeholders = commonCols.map(() => '?').join(',');
                
                try {
                    const newId = crypto.randomUUID();
                    await run(targetDb, `INSERT INTO Properties (id, ${commonCols.join(',')}) VALUES (?, ${placeholders})`, [newId, ...values]);
                    console.log(`[OK] Successfully inserted: ${bp.propertyName}`);
                    insertedCount++;
                } catch (insErr) {
                    console.error(`[ERR] Failed to insert ${bp.propertyName}:`, insErr.message);
                }
            }
        }

        console.log(`Summary: Updated ${updatedCount} records, Inserted ${insertedCount} records.`);
        
        targetDb.close();
        backupDb.close();
        process.exit(0);
    } catch (error) {
        console.error('Restoration failed:', error);
        process.exit(1);
    }
}

start();
