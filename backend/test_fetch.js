const { Inquiry, Property, User } = require('./src/models');
const sequelize = require('./src/config/database');

async function run() {
    try {
        console.log("Fetching...");
        const inquiries = await Inquiry.findAll({
            where: {},
            include: [{
                model: Property,
                attributes: ['propertyName', 'location', 'price', 'priceUnit', 'category']
            }, {
                model: User,
                attributes: ['username', 'id']
            }],
            order: [['createdAt', 'DESC']]
        });
        console.log("Count:", inquiries.length);
        process.exit(0);
    } catch(e) {
        console.error("ERROR:");
        console.error(e.message);
        process.exit(1);
    }
}
run();
