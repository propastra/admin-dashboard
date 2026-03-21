const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log("Database path:", dbPath);

db.serialize(() => {
    db.run('ALTER TABLE Properties ADD COLUMN coverPhoto VARCHAR(255)', function(err) {
        if (err) {
            console.error("Error adding coverPhoto to Properties:", err.message);
        } else {
            console.log("Successfully added coverPhoto to Properties");
        }
    });
});

db.close();
