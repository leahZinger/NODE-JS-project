const express = require('express');
const router = express.Router();
const crud = require('../DAL/crud/CRUD');

router.get('/campaign-info', async (req, res) => {
    try {
        const info = await crud.getCampaignInfo();
        res.json(info);
    } catch (err) {
        res.status(500).json({ error: "שגיאה במשיכת נתוני קמפיין" });
    }
});

router.get('/groups', async (req, res) => {
    try {
        const groups = await crud.getAllGroups();
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: "שגיאה במשיכת נבחרות" });
    }
});

router.get('/donors', async (req, res) => {
    try {
        const donors = await crud.getAllDonations();
        res.json(donors);
    } catch (err) {
        res.status(500).json({ error: "שגיאה במשיכת רשימת תורמים" });
    }
});

router.post('/donate', async (req, res) => {
    const { name, amount, groupId } = req.body;
    const donationAmount = Number(amount);

    try {
        const newDonation = await crud.addDonation({ 
            name, 
            amount: donationAmount, 
            groupId 
        });

        await crud.updateGroupAmount(groupId, donationAmount);
        await crud.updateCampaignTotal(donationAmount);

        res.status(201).json({ success: true, donation: newDonation });
    } catch (err) {
        res.status(500).json({ error: "שגיאה בביצוע התרומה" });
    }
});

router.delete('/donation/:id', async (req, res) => {
    const adminKey = req.headers['admin-key'];
    if (adminKey !== '123456') return res.status(403).json({ error: "גישה נדחתה" });

    try {
        const donation = await crud.getDonationById(req.params.id);
        if (!donation) return res.status(404).json({ error: "תרומה לא נמצאה" });

        await crud.updateGroupAmount(donation.groupId, -donation.amount);
        await crud.updateCampaignTotal(-donation.amount);

        await crud.deleteDonation(req.params.id);
        
        res.json({ message: "התרומה נמחקה והסכומים עודכנו" });
    } catch (err) {
        res.status(500).json({ error: "שגיאה במחיקת התרומה" });
    }
});

router.put('/update-goal', async (req, res) => {
    const adminKey = req.headers['admin-key'];
    const { newGoal } = req.body;
    
    if (adminKey !== '123456') return res.status(403).json({ error: "לא מורשה" });

    try {
        const updated = await crud.updateGoal(newGoal);
        res.json({ message: "היעד עודכן בהצלחה", updated });
    } catch (err) {
        res.status(500).json({ error: "שגיאה בעדכון היעד" });
    }
});

module.exports = router;