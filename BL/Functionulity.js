const fs = require('fs');
const path = require('path');

// הנתיב לקובץ ה-JSON שלך
const dbPath = path.resolve(__dirname, '..', 'DAL', 'models', 'matchingData.json');

const readDB = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            console.error("קובץ הנתונים חסר בנתיב:", dbPath);
            return { campaign: {}, groups: [], donors: [] };
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("שגיאה בקריאת הקובץ:", err);
        return { campaign: {}, groups: [], donors: [] };
    }
};

const writeDB = (data) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("שגיאה בכתיבה לקובץ:", err);
    }
};

const getAllGroup = () => readDB().groups || [];

const getCampaignStatus = () => {
    const db = readDB();
    const status = { ...db.campaign };
    // מעדכן את מספר התורמים בזמן אמת לפי אורך המערך
    status.donorCount = db.donors ? db.donors.length : 0; 
    return status;
};

const getGroupById = (groupId) => {
    const db = readDB();
    return db.donors.filter(d => d.groupId === parseInt(groupId));
};

const getDonerById = (donorId) => {
    const db = readDB();
    return db.donors.find(d => d.id === parseInt(donorId));
};

const AddDonation = (donorName, amount, groupId) => {
    const db = readDB();
    const amountNum = parseFloat(amount);
    const gId = parseInt(groupId);
    
    const newDonor = {
        id: db.donors.length > 0 ? db.donors[db.donors.length - 1].id + 1 : 1,
        name: donorName,
        amount: amountNum,
        groupId: gId, 
        date: new Date().toISOString()
    };

    db.donors.push(newDonor);
    
    // עדכון הסכום שנאסף בנבחרת
    const group = db.groups.find(g => g.id === gId);
    if (group) group.raised += amountNum;
    
    // עדכון הסכום הכללי בקמפיין (כולל המכפיל)
    if (db.campaign) {
        db.campaign.totalRaised += (amountNum * (db.campaign.multiplier || 1));
    }

    writeDB(db);
    return newDonor;
};

const deleteDonation = (id) => {
    const db = readDB();
    const donorId = parseInt(id);
    const index = db.donors.findIndex(d => d.id === donorId);
    
    if (index === -1) return false;

    const donor = db.donors[index];
    
    const group = db.groups.find(g => g.id === donor.groupId);
    if (group) group.raised -= donor.amount;
    
    if (db.campaign) {
        db.campaign.totalRaised -= (donor.amount * (db.campaign.multiplier || 1));
    }

    db.donors.splice(index, 1);
    writeDB(db);
    return true;
};

const updateCampaignGoal = (newGoal) => {
    const db = readDB();
    if (db.campaign) {
        db.campaign.goal = parseFloat(newGoal);
        writeDB(db);
        return db.campaign;
    }
    return null;
};

module.exports = { 
    getAllGroup, 
    getCampaignStatus, 
    getDonerById, 
    getGroupById, 
    AddDonation, 
    updateCampaignGoal,
    deleteDonation,
    readDB 
};