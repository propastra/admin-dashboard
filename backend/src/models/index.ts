const sequelize = require('../config/database');
const Property = require('./Property');
const User = require('./User');
const Visitor = require('./Visitor');
const Interaction = require('./Interaction');
const Inquiry = require('./Inquiry');
const WebsiteUser = require('./WebsiteUser');
const Favorite = require('./Favorite');
const LoginLead = require('./LoginLead');

// Associations
Property.hasMany(Interaction, { foreignKey: 'propertyId' });
Interaction.belongsTo(Property, { foreignKey: 'propertyId' });

Visitor.hasMany(Interaction, { foreignKey: 'visitorId' });
Interaction.belongsTo(Visitor, { foreignKey: 'visitorId' });

Property.hasMany(Inquiry, { foreignKey: 'propertyId' });
Inquiry.belongsTo(Property, { foreignKey: 'propertyId' });

// Website User Favorites
WebsiteUser.hasMany(Favorite, { foreignKey: 'websiteUserId' });
Favorite.belongsTo(WebsiteUser, { foreignKey: 'websiteUserId' });

Property.hasMany(Favorite, { foreignKey: 'propertyId' });
Favorite.belongsTo(Property, { foreignKey: 'propertyId' });

// Login Leads
WebsiteUser.hasMany(LoginLead, { foreignKey: 'websiteUserId' });
LoginLead.belongsTo(WebsiteUser, { foreignKey: 'websiteUserId' });

module.exports = {
    sequelize,
    Property,
    User,
    Visitor,
    Interaction,
    Inquiry,
    WebsiteUser,
    Favorite,
    LoginLead,
};
