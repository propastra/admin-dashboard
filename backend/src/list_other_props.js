const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function run() {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'f:/Propastra/admin-dashboard/backend/database.sqlite',
        logging: false
    });

    try {
        const Property = sequelize.define('Property', {
            id: { type: DataTypes.UUID, primaryKey: true },
            propertyName: DataTypes.STRING,
            location: DataTypes.STRING,
            city: DataTypes.STRING,
            country: DataTypes.STRING
        }, { tableName: 'Properties', timestamps: false });

        const props = await Property.findAll({
            attributes: ['propertyName', 'location', 'city', 'country']
        });

        console.log(`Total properties in DB: ${props.length}`);

        // Helper function (simulating the one in MapExplorer.jsx)
        const getLocationMeta = (prop) => {
            let city = prop.city;
            let country = prop.country;
            const loc = (prop.location || "").toLowerCase();
            
            const indiaKeywords = ['india', 'bangalore', 'bengaluru', 'goa', 'mumbai', 'pune', 'delhi', 'hyderabad', 'chennai', 'kolkata', 'gurgaon', 'noida', 'ahmedabad', 'karnataka', 'maharashtra', 'sarjapur', 'whitefield', 'yelahanka', 'devanahalli', 'bicholim', 'doddaballapur', 'rajanukunte', 'rayasandra', 'jigani', 'electronic city', 'anekal'];
            const uaeKeywords = ['uae', 'dubai', 'emirates', 'abu dhabi', 'abudhabi', 'sharjah', 'ajman', 'rak', 'fujairah', 'quran', 'marina', 'jumeirah', 'downtown', 'business bay', 'palm', 'creek', 'ghadeer'];

            const isIndia = loc.includes('india') || indiaKeywords.some(k => loc.includes(k));
            const isUAE = loc.includes('uae') || uaeKeywords.some(k => loc.includes(k));

            if (!country) {
                if (isUAE) country = 'UAE';
                else if (isIndia) country = 'India';
                else country = 'Other';
            }

            if (!city || city === 'Other') {
                if (country === 'India') {
                    if (loc.includes('goa') || loc.includes('bicholim')) city = 'Goa';
                    else if (loc.includes('mumbai')) city = 'Mumbai';
                    else if (loc.includes('pune')) city = 'Pune';
                    else if (loc.includes('delhi') || loc.includes('noida') || loc.includes('gurgaon')) city = 'Delhi/NCR';
                    else if (loc.includes('hyderabad')) city = 'Hyderabad';
                    else if (loc.includes('chennai')) city = 'Chennai';
                    else if (['bangalore', 'bengaluru', 'sarjapur', 'whitefield', 'yelahanka', 'devanahalli', 'jigani', 'doddaballapur', 'rajanukunte', 'rayasandra', 'electronic city', 'anekal', 'rr nagar', 'kengeri', 'hosakote', 'hebbal', 'kannamangala', 'varthur', 'bannerghatta', 'yadavanahalli'].some(k => loc.includes(k))) city = 'Bangalore';
                    else city = 'Other';
                } else if (country === 'UAE') {
                    if (loc.includes('abu dhabi') || loc.includes('abudhabi') || loc.includes('ghadeer')) city = 'Abu Dhabi';
                    else if (loc.includes('sharjah')) city = 'Sharjah';
                    else if (loc.includes('ajman')) city = 'Ajman';
                    else if (uaeKeywords.some(k => loc.includes(k))) city = 'Dubai';
                    else city = 'Other';
                } else {
                    city = 'Other';
                }
            }

            return { country: country || 'Other', city: city || 'Other' };
        };

        const otherProps = props.filter(p => {
            const { country } = getLocationMeta(p);
            return country === 'Other';
        });

        console.log(`\nProperties categorized as "Other": ${otherProps.length}`);
        otherProps.slice(0, 50).forEach(p => {
            console.log(`- ${p.propertyName} | LOC: ${p.location} | CITY_DB: ${p.city} | COUNTRY_DB: ${p.country}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

run();
