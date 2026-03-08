const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
        const backupProperties = await query(backupDb, "SELECT * FROM Properties");
        console.log(`Found ${backupProperties.length} properties in backup.`);

        const targetProperties = await query(targetDb, "SELECT id, propertyName, projectName, dimensions FROM Properties");

        let updatedCount = 0;
        let insertedCount = 0;
        
        for (const bp of backupProperties) {
            const bpName = (bp.propertyName || "").trim().toLowerCase();
            const bpProj = (bp.projectName || "").trim().toLowerCase();
            
            if (!bpName && !bpProj) continue;

            // Strategy 1: Exact Name Match
            let match = targetProperties.find(tp => tp.propertyName.trim().toLowerCase() === bpName);
            
            // Strategy 2: Project match
            if (!match && bpProj) {
                const projectMatches = targetProperties.filter(tp => tp.projectName?.trim().toLowerCase() === bpProj);
                if (projectMatches.length > 0) {
                    for (const tp of projectMatches) {
                         // Only update if target has NO photos or if backup has data
                         if (bp.photos && bp.photos !== '[]') {
                            await run(targetDb, "UPDATE Properties SET photos = ? WHERE id = ?", [bp.photos, tp.id]);
                            if (bp.brochure) await run(targetDb, "UPDATE Properties SET brochure = ? WHERE id = ?", [bp.brochure, tp.id]);
                            console.log(`[UPD] Restored media for: ${tp.propertyName} (Matched: ${bp.propertyName})`);
                            updatedCount++;
                         }
                    }
                    continue;
                }
            }

            if (match) {
                if (bp.photos && bp.photos !== '[]') {
                    await run(targetDb, "UPDATE Properties SET photos = ? WHERE id = ?", [bp.photos, match.id]);
                    if (bp.brochure) await run(targetDb, "UPDATE Properties SET brochure = ? WHERE id = ?", [bp.brochure, match.id]);
                    console.log(`[UPD] Restored media for: ${match.propertyName} (Exact Match)`);
                    updatedCount++;
                }
            } else {
                // Strategy 3: INSERT if not found (This is a manual property)
                console.log(`[INS] Found manual property in backup: ${bp.propertyName}. Inserting...`);
                
                // Construct dynamic insert to handle schema differences
                const columns = Object.keys(bp).filter(k => k !== 'id'); // Use new ID
                const values = columns.map(c => bp[c]);
                const placeholders = columns.map(() => '?').join(',');
                
                try {
                    const newId = require('crypto').randomUUID();
                    await run(targetDb, `INSERT INTO Properties (id, ${columns.join(',')}) VALUES (?, ${placeholders})`, [newId, ...values]);
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
