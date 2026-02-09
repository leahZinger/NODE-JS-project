const { Campaign, Group, Donation } = require('../models/db');

const getCampaignInfo = async () => {
    const campaign = await Campaign.findOne().lean();
    const donorCount = await Donation.countDocuments(); 
    if (!campaign) {
        return { totalRaised: 0, goal: 0, donorCount: 0, name: "קמפיין לא נמצא" };
    }
    
    return { ...campaign, donorCount };
};
const getAllGroups = async () => {
    return await Group.find().sort({ id: 1 });
};

const getAllDonations = async () => {
    return await Donation.find().sort({ date: -1 });
};

const addDonation = async (donationData) => {
    console.log("Saving donation to DB:", donationData); 
    const donation = new Donation(donationData);
    const saved = await donation.save();
    console.log("Saved successfully:", saved); 
    return saved;
};

const updateGroupAmount = async (groupId, amount) => {
    return await Group.findOneAndUpdate(
        { id: groupId }, 
        { $inc: { raised: amount } }, 
        { upsert: true, new: true } 
    );
};

const updateCampaignTotal = async (amount) => {
    return await Campaign.findOneAndUpdate(
        {}, 
        { $inc: { totalRaised: amount } }, 
        { upsert: true, new: true }
    );
};

const updateGoal = async (newGoal) => {
    return await Campaign.findOneAndUpdate({}, { goal: newGoal }, { new: true });
};

const getDonationById = async (id) => {
    return await Donation.findById(id);
};

const deleteDonation = async (id) => {
    return await Donation.findByIdAndDelete(id);
};

module.exports = {
    getCampaignInfo,
    getAllGroups,
    getAllDonations,
    addDonation,
    updateGroupAmount,
    updateCampaignTotal,
    updateGoal,
    getDonationById,
    deleteDonation
};