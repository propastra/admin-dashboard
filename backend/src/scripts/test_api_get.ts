const { User } = require('./src/models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testFetchApi() {
    const admin = await User.findOne({ where: { role: 'Admin' } });
    if (!admin) return console.log('No admin found');
    
    const token = jwt.sign({ user: { id: admin.id } }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    
    // fetch is available globally in Node 18+
    try {
        const res = await fetch('http://localhost:5001/api/inquiries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const text = await res.text();
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            const data = JSON.parse(text);
            console.log(`Success, got ${data.length} items. First item:`, JSON.stringify(data[0], null, 2));
        } else {
            console.log(`Error body:`, text);
        }
    } catch(e) {
        console.error('Fetch failed:', e);
    }
}
testFetchApi();
