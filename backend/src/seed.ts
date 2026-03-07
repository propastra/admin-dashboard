const sequelize = require('./config/database');
const { User } = require('./models');

const seed = async () => {
    try {
        await sequelize.sync({ force: false }); // Don't drop tables if they exist

        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (adminExists) {
            console.log('Admin user already exists');
            return;
        }

        await User.create({
            username: 'admin',
            password: 'password123', // Will be hashed by hook
            role: 'Admin'
        });

        console.log('Admin user created');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await sequelize.close();
    }
};

seed();
