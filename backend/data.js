import wixData from 'wix-data';

const PRIMARY_KEYS = {
    ViatorProducts: 'productCode',
    ViatorLocations: 'locationId',
    ViatorExchangeRates: 'currencyCode',
    ViatorBookings: 'bookingRef'
};

async function mergeExisting(collectionName, item) {
    const keyField = PRIMARY_KEYS[collectionName];
    if (!keyField || !item[keyField]) {
        return item;
    }
    try {
        const existing = await wixData.query(collectionName)
            .eq(keyField, item[keyField])
            .limit(1)
            .find();
        if (existing.items.length) {
            return { ...existing.items[0], ...item, _id: existing.items[0]._id };
        }
    } catch (error) {
        console.error(`mergeExisting error for ${collectionName}:`, error);
    }
    return item;
}

export async function ViatorProducts_beforeInsert(item) {
    return mergeExisting('ViatorProducts', item);
}

export async function ViatorProducts_beforeUpdate(item) {
    return mergeExisting('ViatorProducts', item);
}

export async function ViatorLocations_beforeInsert(item) {
    return mergeExisting('ViatorLocations', item);
}

export async function ViatorLocations_beforeUpdate(item) {
    return mergeExisting('ViatorLocations', item);
}

export async function ViatorExchangeRates_beforeInsert(item) {
    return mergeExisting('ViatorExchangeRates', item);
}

export async function ViatorExchangeRates_beforeUpdate(item) {
    return mergeExisting('ViatorExchangeRates', item);
}

export async function ViatorBookings_beforeInsert(item) {
    return mergeExisting('ViatorBookings', item);
}

export async function ViatorBookings_beforeUpdate(item) {
    return mergeExisting('ViatorBookings', item);
}
