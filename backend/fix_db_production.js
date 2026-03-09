const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
console.log("Attempting to fix database at:", dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add email column if missing
    db.run('ALTER TABLE Inquiries ADD COLUMN email VARCHAR(255)', function(err) {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("[✓] column 'email' already exists.");
            } else {
                console.error("[!] Error adding 'email':", err.message);
            }
        } else {
            console.log("[+] Successfully added 'email' column to Inquiries.");
        }
    });

    // Add websiteUserId column if missing
    db.run('ALTER TABLE Inquiries ADD COLUMN websiteUserId CHAR(36)', function(err) {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("[✓] column 'websiteUserId' already exists.");
            } else {
                console.error("[!] Error adding 'websiteUserId':", err.message);
            }
        } else {
            console.log("[+] Successfully added 'websiteUserId' column to Inquiries.");
        }
    });
});

db.close((err) => {
    if (err) {
        console.error("Error closing database:", err.message);
    } else {
        console.log("Database fix completed. Please restart the backend.");
    }
});
