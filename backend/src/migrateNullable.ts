const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Starting migration to allow NULL values in core fields...');

db.serialize(() => {
    db.run('PRAGMA foreign_keys=OFF;');

    db.run('BEGIN TRANSACTION;');

    // Create new table with relaxed constraints
    db.run(`
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

    // Check if Properties table exists before moving data
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='Properties'", (err, row) => {
        if (row) {
            db.run('INSERT INTO "Properties_new" SELECT * FROM "Properties";', (err) => {
                if (err) {
                    console.error('Error copying data:', err.message);
                    db.run('ROLLBACK;');
                    process.exit(1);
                }

                db.run('DROP TABLE "Properties";');
                db.run('ALTER TABLE "Properties_new" RENAME TO "Properties";');
                db.run('COMMIT;', (err) => {
                    if (err) {
                        console.error('Error committing transaction:', err.message);
                        process.exit(1);
                    }
                    console.log('Migration successful: core fields are now nullable.');
                    db.close();
                });
            });
        } else {
            db.run('ALTER TABLE "Properties_new" RENAME TO "Properties";');
            db.run('COMMIT;');
            console.log('Migration successful: Properties table created with nullable fields.');
            db.close();
        }
    });
});
