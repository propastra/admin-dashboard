const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:' });
const Inquiry = sequelize.define('Inquiry', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING },
    websiteUserId: { type: DataTypes.STRING, allowNull: true } // model has it
}, { timestamps: false });

async function run() {
    // but DB table does NOT!
    await sequelize.query("CREATE TABLE Inquiries (id TEXT PRIMARY KEY, name TEXT);");
    try {
        await Inquiry.create({ name: 'test' }); // payload doesnt have websiteUserId
        console.log("SUCCESS!");
    } catch(e) {
        console.log("ERROR:", e.message);
    }
}
run();
