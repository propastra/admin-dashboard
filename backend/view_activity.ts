const { Interaction, Property, Visitor, WebsiteUser, sequelize } = require('./src/models');

async function viewActivity() {
    try {
        await sequelize.authenticate();
        
        const interactions = await Interaction.findAll({
            include: [
                { model: Property, attributes: ['propertyName'] },
                { model: Visitor, attributes: ['ipAddress'] },
                { model: WebsiteUser, attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 30
        });

        console.log('\n--- RECENT USER ACTIVITY LOG ---\n');
        
        if (interactions.length === 0) {
            console.log('No interactions found.');
        }

        interactions.forEach((act: any) => {
            const time = new Date(act.createdAt).toLocaleString();
            const type = act.interactionType.padEnd(12);
            const property = (act.Property?.propertyName || 'N/A').substring(0, 25).padEnd(25);
            const user = (act.WebsiteUser?.name || act.Visitor?.ipAddress || 'Anon').padEnd(20);
            
            let details = '';
            if (act.interactionType === 'Comparison' && act.metadata) {
                const names = act.metadata.propertyNames || [];
                details = `✨ Comparing: [${names.join(' vs ')}]`;
            } else if (act.interactionType === 'Click') {
                details = `🖱️ Clicked property`;
            } else if (act.metadata) {
                details = `📝 ${JSON.stringify(act.metadata)}`;
            }

            console.log(`[${time}] ${type} | Prop: ${property} | User/IP: ${user} | ${details}`);
        });

        console.log('\n-------------------------------\n');
        process.exit(0);
    } catch (error: any) {
        console.error('Error fetching activity:', error.message);
        process.exit(1);
    }
}

viewActivity();
