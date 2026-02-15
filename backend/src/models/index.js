const sequelize = require('../config/database');
const Property = require('./Property');
const User = require('./User');
const Visitor = require('./Visitor');
const Interaction = require('./Interaction');
const Inquiry = require('./Inquiry');

// Associations
Property.hasMany(Interaction, { foreignKey: 'propertyId' });
Interaction.belongsTo(Property, { foreignKey: 'propertyId' });

Visitor.hasMany(Interaction, { foreignKey: 'visitorId' });
Interaction.belongsTo(Visitor, { foreignKey: 'visitorId' });

Property.hasMany(Inquiry, { foreignKey: 'propertyId' });
Inquiry.belongsTo(Property, { foreignKey: 'propertyId' });

module.exports = {
    sequelize,
    Property,
    User,
    Visitor,
    Interaction,
    Inquiry,
};
