const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
const Inquiry = sequelize.define('Inquiry', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    websiteUserId: { type: DataTypes.STRING, allowNull: true },
    propertyId: { type: DataTypes.STRING, allowNull: true } // not in DB
}, { timestamps: false });

async function run() {
    await sequelize.query("CREATE TABLE Inquiries (id TEXT PRIMARY KEY, name TEXT);");
    let payload = { name: 'test', websiteUserId: null, propertyId: null };
    let newInquiry;
    let success = false;
    let retryCount = 0;
    while (!success && retryCount < 5) {
        try {
            console.log('Trying keys:', Object.keys(payload));
            newInquiry = await Inquiry.create(payload);
            success = true;
            console.log('SUCCESS!');
        } catch(e) {
            console.log('Error:', e.message);
            const msg = e.message;
            // FIXED REGEX
            const match = msg.match(/no column named (\w+)/) || msg.match(/column (\w+) /);
            if (match) {
                console.log('Deleting:', match[1]);
                delete payload[match[1]];
            } else { break; }
            retryCount++;
        }
    }
    console.log("FINAL NEW INQUIRY:", newInquiry ? newInquiry.toJSON() : undefined);
}
run();
