const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting migration to allow NULL values in core fields...');

function run(db: any, sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function get(db: any, sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

async function migrate() {
    await run(db, 'PRAGMA foreign_keys=OFF;');

    // Idempotent: drop leftover Properties_new from a previous failed run
    const newTableExists = await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='Properties_new'");
    if (newTableExists) {
        console.log('Dropping leftover Properties_new table from previous run...');
        await run(db, 'DROP TABLE "Properties_new";');
    }

    // If Properties already has brochure/floorPlan, migration was already applied
    const propsExists = await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='Properties'");
    if (propsExists) {
        const cols = await new Promise<any[]>((resolve, reject) => {
            db.all('PRAGMA table_info(Properties)', (err: Error | null, rows: any[]) => (err ? reject(err) : resolve(rows || [])));
        });
        const hasBrochure = cols.some((c: any) => c.name === 'brochure');
        const hasFloorPlan = cols.some((c: any) => c.name === 'floorPlan');
        if (hasBrochure && hasFloorPlan) {
            console.log('Migration already applied (Properties has brochure and floorPlan).');
            db.close();
            process.exit(0);
        }
    }

    await run(db, 'BEGIN TRANSACTION;');

    try {
        await run(db, `
        CREATE TABLE "Properties_new" (
            "id" UUID PRIMARY KEY, 
            "propertyName" VARCHAR(255), 
            "description" TEXT, 
            "category" TEXT, 
            "location" VARCHAR(255), 
            "price" DECIMAL(15,2), 
            "priceUnit" TEXT DEFAULT 'Lakhs', 
            "dimensions" VARCHAR(255), 
            "configuration" VARCHAR(255), 
            "photos" JSON DEFAULT '[]', 
            "brochure" JSON DEFAULT '[]', 
            "floorPlan" JSON DEFAULT '[]', 
            "projectName" VARCHAR(255), 
            "amenities" JSON DEFAULT '[]', 
            "status" TEXT DEFAULT 'Available', 
            "latitude" FLOAT, 
            "longitude" FLOAT, 
            "reraNumber" VARCHAR(255), 
            "builderInfo" VARCHAR(255), 
            "isVerified" TINYINT(1) DEFAULT 0, 
            "projectHighlights" JSON DEFAULT '[]', 
            "possessionStatus" TEXT DEFAULT 'Ready to Move', 
            "furnishingStatus" TEXT DEFAULT 'Unfurnished', 
            "bhk" INTEGER, 
            "possessionTime" VARCHAR(255), 
            "developerName" VARCHAR(255), 
            "landParcel" VARCHAR(255), 
            "floor" VARCHAR(255), 
            "units" VARCHAR(255), 
            "investmentType" VARCHAR(255), 
            "createdAt" DATETIME NOT NULL, 
            "updatedAt" DATETIME NOT NULL
        );
    `);

        const propsRow = await get(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='Properties'");
        if (propsRow) {
            await run(db, 'INSERT INTO "Properties_new" SELECT * FROM "Properties";');
            await run(db, 'DROP TABLE "Properties";');
        }
        await run(db, 'ALTER TABLE "Properties_new" RENAME TO "Properties";');
        await run(db, 'COMMIT;');
        console.log('Migration successful: core fields are now nullable.');
    } catch (err: any) {
        await run(db, 'ROLLBACK;').catch(() => {});
        console.error('Migration failed:', err?.message || err);
        process.exit(1);
    } finally {
        db.close();
    }
}

migrate().catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
});
