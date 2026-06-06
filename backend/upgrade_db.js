const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Database Path:", dbPath);

const db = new sqlite3.Database(dbPath);

const addColumn = (tableName, columnName, columnDefinition) => {
    return new Promise((resolve) => {
        db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, function(err) {
            if (err) {
                if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
                    console.log(`[✓] ${tableName} column '${columnName}' already exists.`);
                    resolve();
                } else {
                    console.error(`[!] Error adding '${columnName}' to ${tableName}:`, err.message);
                    resolve(); // Resolve to let other columns proceed
                }
            } else {
                console.log(`[+] Successfully added '${columnName}' to ${tableName}.`);
                resolve();
            }
        });
    });
};

db.serialize(async () => {
    console.log("Starting full idempotent database migration/upgrade...");
    
    // Properties Table Upgrades
    await addColumn('Properties', 'coverPhoto', 'VARCHAR(255)');
    await addColumn('Properties', 'brochure', 'JSON DEFAULT \'[]\'');
    await addColumn('Properties', 'floorPlan', 'JSON DEFAULT \'[]\'');
    await addColumn('Properties', 'masterPlan', 'JSON DEFAULT \'[]\'');
    await addColumn('Properties', 'possessionTime', 'VARCHAR(255)');
    await addColumn('Properties', 'developerName', 'VARCHAR(255)');
    await addColumn('Properties', 'developerId', 'UUID');
    await addColumn('Properties', 'landParcel', 'VARCHAR(255)');
    await addColumn('Properties', 'floor', 'VARCHAR(255)');
    await addColumn('Properties', 'units', 'VARCHAR(255)');
    await addColumn('Properties', 'investmentType', 'VARCHAR(255)');
    await addColumn('Properties', 'isSoldOut', 'BOOLEAN DEFAULT 0');

    // Inquiries Table Upgrades
    await addColumn('Inquiries', 'email', 'VARCHAR(255)');
    await addColumn('Inquiries', 'websiteUserId', 'CHAR(36)');
    await addColumn('Inquiries', 'source', 'VARCHAR(255)');
    
    // Developers Table creation if missing
    db.run(`
        CREATE TABLE IF NOT EXISTS "Developers" (
            "id" CHAR(36) PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "logo" VARCHAR(255),
            "description" TEXT,
            "website" VARCHAR(255),
            "createdAt" DATETIME NOT NULL,
            "updatedAt" DATETIME NOT NULL
        );
    `, function(err) {
        if (err) {
            console.error("[!] Error creating Developers table:", err.message);
        } else {
            console.log("[✓] Developers table is ready.");
        }
    });

    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err.message);
        } else {
            console.log("Database upgrade script completed successfully.");
        }
    });
});
