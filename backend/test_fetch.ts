const { Inquiry, Property, User } = require('./src/models');

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
        console.log(JSON.stringify(inquiries.slice(0, 2), null, 2));
        process.exit(0);
    } catch(e) {
        console.error("ERROR:", e.message);
        process.exit(1);
    }
}
run();
