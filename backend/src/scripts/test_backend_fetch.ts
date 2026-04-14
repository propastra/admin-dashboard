
const { Inquiry, Property, User } = require('./src/models');
const sequelize = require('./src/config/database');

async function test() {
    try {
        console.log('Fetching inquiries with specific attributes...');
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
        console.log(`Success, got ${inquiries.length} inquiries`);
        if (inquiries.length > 0) {
            console.log('First inquiry:', JSON.stringify(inquiries[0], null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error('Fetch failed:', err);
        process.exit(1);
    }
}

test();
