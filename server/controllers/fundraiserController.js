const Fundraiser = require('../models/Fundraiser');
const User = require('../models/User');

exports.createFundraiser = async (req, res) => {

  try {
    const { title, description, goalAmount, cardName, cardNumber, bonuses } = req.body;
    const newFundraiser = new Fundraiser({
      title, description, goalAmount, cardName, cardNumber,
      bonuses: bonuses || [],
      createdBy: req.user.id
    });
    await newFundraiser.save();
    res.status(201).json(newFundraiser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.getAllFundraisers = async (req, res) => {

  try {
    const fundraisers = await Fundraiser.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json(fundraisers);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

exports.simulateDonation = async (req, res) => {
  try {
    const { amount } = req.body;
    const fundraiser = await Fundraiser.findById(req.params.id);

    if (!fundraiser) {
      return res.status(404).json({ msg: 'Збір не знайдено' });
    }
    if (fundraiser.status === 'closed') {
      return res.status(400).json({ msg: 'Цей збір вже закрито' });
    }

    const COEFFICIENT = 0.1;
    const pointsToAward = Math.floor(Number(amount) * COEFFICIENT);

    fundraiser.collectedAmount += Number(amount);

    if (fundraiser.collectedAmount >= fundraiser.goalAmount) {
      fundraiser.status = 'closed';
    }

    await fundraiser.save();

    let awardedBonus = null;
    let extraMsg = '';
    if (fundraiser.bonuses && fundraiser.bonuses.length > 0) {
      const sortedBonuses = [...fundraiser.bonuses].sort((a, b) => b.minimumAmount - a.minimumAmount);
      for (const b of sortedBonuses) {
        if (Number(amount) >= b.minimumAmount) {
          awardedBonus = b;
          break;
        }
      }
    }

    if (pointsToAward > 0 || awardedBonus) {
      const user = await User.findById(req.user.id);
      
      if (pointsToAward > 0) {
        user.points += pointsToAward;
        const { checkAndAwardBadges } = require('./contributionController');
        await checkAndAwardBadges(user);
      }

      if (awardedBonus) {
        user.rewards.push({
          type: 'PROMOCODE',
          name: awardedBonus.description,
          code: awardedBonus.promoCode,
          source: fundraiser.title
        });
        extraMsg = ` Ви отримали бонус: ${awardedBonus.description} (Код: ${awardedBonus.promoCode})!`;
      }

      await user.save();
    }

    res.json({
      fundraiser: fundraiser,
      msg: `Дякуємо! Вам нараховано ${pointsToAward} балів!${extraMsg}`
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.getAllFundraisersAdmin = async (req, res) => {
  try {
    const fundraisers = await Fundraiser.find({})
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(fundraisers);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

exports.updateFundraiser = async (req, res) => {
  try {
    const { title, description, goalAmount, status, cardName, cardNumber, bonuses } = req.body;
    const fundraiser = await Fundraiser.findById(req.params.id);
    if (!fundraiser) return res.status(404).json({ msg: 'Збір не знайдено' });

    fundraiser.title = title || fundraiser.title;
    fundraiser.description = description || fundraiser.description;
    fundraiser.goalAmount = goalAmount !== undefined ? Number(goalAmount) : fundraiser.goalAmount;
    fundraiser.status = status || fundraiser.status;
    fundraiser.cardName = cardName || fundraiser.cardName;
    fundraiser.cardNumber = cardNumber || fundraiser.cardNumber;
    if (bonuses !== undefined) fundraiser.bonuses = bonuses;

    await fundraiser.save();
    res.json(fundraiser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

exports.deleteFundraiser = async (req, res) => {
  try {
    const fundraiser = await Fundraiser.findById(req.params.id);
    if (!fundraiser) return res.status(404).json({ msg: 'Збір не знайдено' });

    await Fundraiser.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Збір видалено' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};
