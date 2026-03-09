const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Database path:", dbPath);

db.serialize(() => {
    db.run('ALTER TABLE Inquiries ADD COLUMN websiteUserId CHAR(36) REFERENCES WebsiteUsers(id)', function(err) {
        if (err) {
            console.error("Error adding websiteUserId to Inquiries:", err.message);
        } else {
            console.log("Successfully added websiteUserId to Inquiries");
        }
    });
});

db.close();
