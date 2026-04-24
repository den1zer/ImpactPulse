const Fundraiser = require('../models/Fundraiser');
const User = require('../models/User');

exports.createFundraiser = async (req, res) => {

  try {
    const { title, description, goalAmount, cardName, cardNumber } = req.body;
    const newFundraiser = new Fundraiser({
      title, description, goalAmount, cardName, cardNumber,
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

    if (pointsToAward > 0) {
      const user = await User.findById(req.user.id);
      user.points += pointsToAward;

      const { checkAndAwardBadges } = require('./contributionController');
      await checkAndAwardBadges(user);

      await user.save();
    }

    res.json({
      fundraiser: fundraiser,
      msg: `Дякуємо! Вам нараховано ${pointsToAward} балів!`
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
    const { title, description, goalAmount, status, cardName, cardNumber } = req.body;
    const fundraiser = await Fundraiser.findById(req.params.id);
    if (!fundraiser) return res.status(404).json({ msg: 'Збір не знайдено' });

    fundraiser.title = title || fundraiser.title;
    fundraiser.description = description || fundraiser.description;
    fundraiser.goalAmount = goalAmount !== undefined ? Number(goalAmount) : fundraiser.goalAmount;
    fundraiser.status = status || fundraiser.status;
    fundraiser.cardName = cardName || fundraiser.cardName;
    fundraiser.cardNumber = cardNumber || fundraiser.cardNumber;

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
