const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.get("SELECT COUNT(*) as cnt FROM Properties;", (err, row) => {
    if (err) console.error(err);
    else console.log("Total properties:", row.cnt);
  });
});
db.close();
