const sequelize = require('./config/database');
const { User, Developer, Property } = require('./models');

const developers = [
    { name: 'SHRIRAM PROPERTIES', logo: 'https://www.google.com/s2/favicons?sz=256&domain=shriramproperties.com', projectsCount: 45 },
    { name: 'DNR GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=dnrgroup.in', projectsCount: 12 },
    { name: 'ASSETZ GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=assetzproperty.com', projectsCount: 20 },
    { name: 'EMBASSY GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=embassyindia.com', projectsCount: 30 },
    { name: 'BRIGADE GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=brigadegroup.com', projectsCount: 50 },
    { name: 'SATTVA GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=sattvagroup.com', projectsCount: 35 },
    { name: 'ABHEE', logo: 'https://www.google.com/s2/favicons?sz=256&domain=abheebuilders.com', projectsCount: 15 },
    { name: 'GOYAL AND CO', logo: 'https://www.google.com/s2/favicons?sz=256&domain=goyalco.com', projectsCount: 18 },
    { name: 'CENTURY REAL ESTATE', logo: 'https://www.google.com/s2/favicons?sz=256&domain=centuryrealestate.in', projectsCount: 25 },
    { name: 'MANA PROJECTS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=manaprojects.com', projectsCount: 10 },
    { name: 'PRESTIGE GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=prestigeconstructions.com', projectsCount: 77 },
    { name: 'CASAGRAND', logo: 'https://www.google.com/s2/favicons?sz=256&domain=casagrand.co.in', projectsCount: 40 },
    { name: 'CASATRANCE', logo: 'https://www.google.com/s2/favicons?sz=256&domain=casatrance.com', projectsCount: 5 },
    { name: 'MERUSRI', logo: 'https://www.google.com/s2/favicons?sz=256&domain=merusri.com', projectsCount: 8 },
    { name: 'GODREJ Properties', logo: 'https://companieslogo.com/img/orig/GODREJPROP.NS-202094de.png?t=1720244492', projectsCount: 19 },
    { name: 'ATMOS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=atmoslifestyle.com', projectsCount: 3 },
    { name: 'URBANRISE', logo: 'https://www.google.com/s2/favicons?sz=256&domain=urbanrise.in', projectsCount: 15 },
    { name: 'MJR BUILDERS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=mjrbuilders.in', projectsCount: 10 },
    { name: 'TVS', logo: 'https://www.kenyt.ai/static/Organizations/TVS-8961621/TVS_VerdeVista/Images/logo.png', projectsCount: 12 },
    { name: 'KHETHRA GROUP', logo: 'https://www.google.com/s2/favicons?sz=256&domain=kshetra.com', projectsCount: 6 },
    { name: 'RUCHIRA PROJECTS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=ruchiraprojects.com', projectsCount: 7 },
    { name: 'SIPANI PROPERTIES', logo: 'https://www.google.com/s2/favicons?sz=256&domain=sipani.in', projectsCount: 14 },
    { name: 'LEGACY', logo: 'https://legacy.in/assets/images/homepage-optimized-images/Legacy%20Logo.png', projectsCount: 20 },
    { name: 'PURAVANKARA', logo: 'https://www.google.com/s2/favicons?sz=256&domain=puravankara.com', projectsCount: 60 },
    { name: 'BRICKS AND MILESTONE', logo: 'https://www.google.com/s2/favicons?sz=256&domain=bricksandmilestones.com', projectsCount: 5 },
    { name: 'TRAFFICA', logo: 'https://www.google.com/s2/favicons?sz=256&domain=traffica.net', projectsCount: 4 },
    { name: 'DS MAX', logo: 'https://www.google.com/s2/favicons?sz=256&domain=dsmaxproperties.com', projectsCount: 30 },
    { name: 'SOWPERNIKA', logo: 'https://www.google.com/s2/favicons?sz=256&domain=sowparnikaprojects.com', projectsCount: 22 },
    { name: 'NAMBIAR BUILDERS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=nambiarbuilders.com', projectsCount: 15 },
    { name: 'HOUSE OF ABHINANDAN LODHA', logo: 'https://www.google.com/s2/favicons?sz=256&domain=houseofabhinandanlodha.in', projectsCount: 45 },
    { name: 'SJ DEVELOPERS', logo: 'https://www.google.com/s2/favicons?sz=256&domain=sjdevelopers.com', projectsCount: 8 },
    { name: 'NVT', logo: 'https://www.google.com/s2/favicons?sz=256&domain=nvtqualitylifestyle.com', projectsCount: 10 },
    { name: 'MAA HOMES', logo: 'https://www.google.com/s2/favicons?sz=256&domain=maahomes.in', projectsCount: 6 },
    { name: 'SOBHA LIMITED', logo: 'https://www.google.com/s2/favicons?sz=256&domain=sobha.com', projectsCount: 40 },
];

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const downloadImage = async (url: string, filename: string) => {
    const dir = path.join(__dirname, '../uploads/developers');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const localPath = path.join(dir, filename);
    
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Failed to download logo for ${filename}:`, err.message);
        return false;
    }
};

const seed = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        // Check if developerId column exists in Properties table
        const tableInfo = await queryInterface.describeTable('Properties');
        if (!tableInfo.developerId) {
            console.log('Adding developerId column to Properties table...');
            await queryInterface.addColumn('Properties', 'developerId', {
                type: require('sequelize').DataTypes.UUID,
                references: {
                    model: 'Developers',
                    key: 'id'
                },
                allowNull: true
            });
        }

        await sequelize.sync({ alter: false });

        // Seed Admin User
        const adminExists = await User.findOne({ where: { username: 'Pujith_Prop' } });
        if (!adminExists) {
            await User.create({
                username: 'Pujith_Prop',
                password: 'Propastra8747',
                role: 'Admin'
            });
            console.log('Admin user created');
        }

        // Seed Developers
        for (const devData of developers) {
            let finalLogo = devData.logo;
            
            // If it's a remote URL, download it
            if (devData.logo.startsWith('http')) {
                const safeName = devData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const filename = `${safeName}.png`;
                console.log(`Downloading logo for ${devData.name}...`);
                const success = await downloadImage(devData.logo, filename);
                if (success !== false) {
                    finalLogo = `/uploads/developers/${filename}`;
                }
            }

            const [dev, created] = await Developer.findOrCreate({
                where: { name: devData.name },
                defaults: { ...devData, logo: finalLogo }
            });
            
            if (!created) {
                await dev.update({ logo: finalLogo });
                console.log(`Developer logo updated: ${devData.name} -> ${finalLogo}`);
            } else {
                console.log(`Developer created: ${devData.name} -> ${finalLogo}`);
            }

            // Associate properties that match this developer name
            const searchKeyword = devData.name.split(' ')[0];
            const updated = await Property.update(
                { 
                    developerId: dev.id,
                    developerName: devData.name 
                },
                { 
                    where: { 
                        [require('sequelize').Op.or]: [
                            { propertyName: { [require('sequelize').Op.like]: `%${searchKeyword}%` } },
                            { projectName: { [require('sequelize').Op.like]: `%${searchKeyword}%` } },
                            { developerName: { [require('sequelize').Op.like]: `%${searchKeyword}%` } },
                            { description: { [require('sequelize').Op.like]: `%${searchKeyword}%` } }
                        ]
                    } 
                }
            );
            if (updated[0] > 0) {
                console.log(`Associated ${updated[0]} properties with ${devData.name}`);
            }
        }

        console.log('Seeding completed');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await sequelize.close();
    }
};

seed();
