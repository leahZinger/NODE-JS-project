const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI)
    .then(() => console.log('מחובר בהצלחה למסד הנתונים בענן! ☁️'))
    .catch(err => console.error('שגיאת חיבור ל-DB:', err));

const Campaign = mongoose.model('Campaign', {
    name: String,
    goal: Number,
    totalRaised: Number,
    multiplier: Number,
    startDate: String,
    endDate: String
});

const Group = mongoose.model('Group', {
    id: Number,
    name: String,
    goal: Number,
    raised: { type: Number, default: 0 }
});

const Donation = mongoose.model('Donation', {
    name: String,
    amount: Number,
    groupId: Number,
    date: { type: Date, default: Date.now }
});

async function seedDatabase() {
    try {
        const campaignCount = await Campaign.countDocuments();
        
        if (campaignCount === 0) {
            console.log('מזהה מסד נתונים ריק. מתחיל ייבוא נתונים מקיף...');

            const dataPath = path.join(__dirname, 'matchingData.json');
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            await Campaign.create(data.campaign);
            await Group.insertMany(data.groups);

            if (data.donors && data.donors.length > 0) {
                await Donation.insertMany(data.donors);
            }

            console.log('✅ הכל מאותחל! קמפיין, נבחרות ותורמים הועלו לענן.');
        }
    } catch (err) {
        console.error('שגיאה בתהליך האתחול:', err);
    }
}

mongoose.connection.once('open', seedDatabase);

module.exports = { Campaign, Group, Donation };