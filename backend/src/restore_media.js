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
        const backupProperties = await query(backupDb, "SELECT * FROM Properties WHERE photos != '[]' AND photos IS NOT NULL");
        console.log(`Found ${backupProperties.length} properties with photos in backup.`);

        const targetProperties = await query(targetDb, "SELECT id, propertyName, projectName, dimensions FROM Properties");

        let updatedCount = 0;
        for (const bp of backupProperties) {
            const bpName = (bp.propertyName || "").trim().toLowerCase();
            const bpProj = (bp.projectName || "").trim().toLowerCase();
            
            // Try exact name match
            let match = targetProperties.find(tp => tp.propertyName.trim().toLowerCase() === bpName);
            
            // Fallback: Project match
            if (!match && bpProj) {
                // If the backup name has standard plot/premium plot, we might need more logic
                // For now, let's match by project name if title fails
                const projectMatches = targetProperties.filter(tp => tp.projectName?.trim().toLowerCase() === bpProj);
                if (projectMatches.length > 0) {
                    // Update all records for this project if they are missing photos
                    for (const tp of projectMatches) {
                         await run(targetDb, "UPDATE Properties SET photos = ? WHERE id = ?", [bp.photos, tp.id]);
                         console.log(`[OK] Updated media for: ${tp.propertyName} (Project Match: ${bp.projectName})`);
                         updatedCount++;
                    }
                    continue; // Already handled this project
                }
            }

            if (match) {
                await run(targetDb, "UPDATE Properties SET photos = ? WHERE id = ?", [bp.photos, match.id]);
                console.log(`[OK] Updated media for: ${match.propertyName} (Exact Match)`);
                updatedCount++;
            }
        }

        console.log(`Successfully restored media for ${updatedCount} records.`);
        
        targetDb.close();
        backupDb.close();
        process.exit(0);
    } catch (error) {
        console.error('Restoration failed:', error);
        process.exit(1);
    }
}

start();
