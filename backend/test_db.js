const sequelize = require('./src/config/database');
const Property = require('./src/models/Property');

async function test() {
  await sequelize.sync();
  const count = await Property.count();
  console.log("Total properties in DB according to Sequelize:", count);
  process.exit(0);
}
test();
