const prisma = require('../config/db');

const SETTINGS_ID = 'default';

// Get store settings (or create default if not exists)
const getStoreSettings = async (req, res, next) => {
    try {
        let settings = await prisma.storeSettings.findUnique({
            where: { id: SETTINGS_ID }
        });

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: { id: SETTINGS_ID }
            });
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

// Update store settings (Owner only)
const updateStoreSettings = async (req, res, next) => {
    try {
        const { name, address, phone, footer } = req.body;

        const settings = await prisma.storeSettings.upsert({
            where: { id: SETTINGS_ID },
            update: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(footer !== undefined && { footer })
            },
            create: {
                id: SETTINGS_ID,
                name: name || 'My POS Store',
                address: address || '',
                phone: phone || '',
                footer: footer || 'Thank you for your purchase!'
            }
        });

        res.status(200).json({ success: true, message: 'Store settings updated', data: settings });
    } catch (error) {
        next(error);
    }
};

// Helper: get settings for internal use (e.g. receipt generation)
const getSettings = async () => {
    let settings = await prisma.storeSettings.findUnique({
        where: { id: SETTINGS_ID }
    });

    if (!settings) {
        settings = await prisma.storeSettings.create({
            data: { id: SETTINGS_ID }
        });
    }

    return settings;
};

module.exports = {
    getStoreSettings,
    updateStoreSettings,
    getSettings
};
