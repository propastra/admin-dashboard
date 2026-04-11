const { Property } = require('../models');
const { Op } = require('sequelize');

/**
 * Enriches property objects with cover photos from sibling properties
 * in the same project, when the property itself has no cover photo set.
 *
 * This is a shared utility used by websiteProperties and websiteFavorites.
 */
const enrichPropertiesWithCoverPhoto = async (properties: any[], isFavoritesFormat = false) => {
    if (!properties || properties.length === 0) return properties;

    const propsWithCovers = await Property.findAll({
        attributes: ['propertyName', 'projectName', 'coverPhoto'],
        where: {
            coverPhoto: { [Op.not]: null, [Op.ne]: '' }
        }
    });

    const getProjectName = (p: any) => {
        if (p.projectName && p.projectName.trim()) return p.projectName.trim().toLowerCase();
        if (p.propertyName) {
            const beforeHyphen = p.propertyName.split('-')[0].trim();
            if (beforeHyphen) return beforeHyphen.toLowerCase();
            return p.propertyName.split(' ').slice(0, 2).join(' ').trim().toLowerCase();
        }
        return '';
    };

    const projectCovers = new Map();
    for (const p of propsWithCovers) {
        const pName = getProjectName(p);
        if (pName && !projectCovers.has(pName)) {
            projectCovers.set(pName, p.coverPhoto);
        }
    }

    return properties.map((p: any) => {
        const pData = p.toJSON ? p.toJSON() : JSON.parse(JSON.stringify(p));

        if (isFavoritesFormat) {
            // Favorites format: { Property: { ... } }
            if (pData.Property && !pData.Property.coverPhoto) {
                const pName = getProjectName(pData.Property);
                if (pName && projectCovers.has(pName)) {
                    pData.Property.coverPhoto = projectCovers.get(pName);
                }
            }
        } else {
            // Standard format: { coverPhoto, ... }
            if (!pData.coverPhoto) {
                const pName = getProjectName(pData);
                if (pName && projectCovers.has(pName)) {
                    pData.coverPhoto = projectCovers.get(pName);
                }
            }
        }

        return pData;
    });
};

module.exports = { enrichPropertiesWithCoverPhoto };
