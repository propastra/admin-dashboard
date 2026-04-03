const mongoose = require('mongoose');

// Adjust the path to your Property model as needed
const Property = require('./src/models/Property');

const MONGODB_URI = 'mongodb+srv://admin:admin123@cluster0.1n8zz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // need to find the correct URI

async function run() {
  await mongoose.connect(MONGODB_URI);
  const props = await Property.find({}).select('propertyName location latitude longitude city').lean();
  console.log(JSON.stringify(props, null, 2));
  process.exit(0);
}
//run();

