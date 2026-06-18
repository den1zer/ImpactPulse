import Fundraiser from '../models/Fundraiser.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { checkAndAwardBadges } from './contributionController.js';

/**
 * Creates a new fundraising campaign.
 *
 * @param {import('express').Request} req - The Express request object containing fundraiser details and an optional file.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the created fundraiser.
 */
export const createFundraiser = async (req, res) => {
  try {
    const { title, description, goalAmount, cardName, cardNumber, bonuses } = req.body;
    const newFundraiser = new Fundraiser({
      title, description, goalAmount, cardName, cardNumber,
      bonuses: bonuses || [],
      coverImage: req.file ? req.file.path : null,
      createdBy: req.user.id
    });
    await newFundraiser.save();

    if (req.io) {
      const user = await User.findById(req.user.id);
      if (user) {
        const message = `${user.username} оголосив новий збір: "${newFundraiser.title}"`;
        await Activity.create({ message, type: 'fundraiser_created' });
        req.io.emit('activity_feed', { message });
      }
    }

    res.status(201).json(newFundraiser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves a list of fundraisers based on a status filter.
 *
 * @param {import('express').Request} req - The Express request object containing the 'filter' query parameter.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of fundraisers.
 */
export const getAllFundraisers = async (req, res) => {
  try {
    const { filter } = req.query;
    let query = { status: 'open' };
    if (filter === 'completed') {
      query = { status: { $in: ['closed', 'reported'] } };
    } else if (filter === 'all') {
      query = {};
    }
    const fundraisers = await Fundraiser.find(query).sort({ createdAt: -1 });
    res.json(fundraisers);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Retrieves detailed information about a specific fundraiser by its ID.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the fundraiser object.
 */
export const getFundraiserById = async (req, res) => {
  try {
    const fundraiser = await Fundraiser.findById(req.params.id);
    if (!fundraiser) return res.status(404).json({ msg: 'Збір не знайдено' });
    res.json(fundraiser);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Simulates a donation to a specific fundraiser, adding funds to the goal.
 * Awards points and applicable bonuses based on the donation amount.
 *
 * @param {import('express').Request} req - The Express request object containing the donation amount.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming the donation and rewards.
 */
export const simulateDonation = async (req, res) => {
  try {
    const { amount } = req.body;
    const fundraiser = await Fundraiser.findById(req.params.id);

    if (!fundraiser) {
      return res.status(404).json({ msg: 'Збір не знайдено' });
    }
    if (fundraiser.status === 'closed') {
      return res.status(400).json({ msg: 'Цей збір вже закрито' });
    }

    // Логіка конвертації донату в бали: за кожні 10 грн нараховується 1 бал (коефіцієнт 0.1).
    const COEFFICIENT = 0.1;
    const pointsToAward = Math.floor(Number(amount) * COEFFICIENT);

    fundraiser.collectedAmount += Number(amount);

    if (fundraiser.collectedAmount >= fundraiser.goalAmount) {
      fundraiser.status = 'closed';
    }

    await fundraiser.save();

    let awardedBonus = null;
    let extraMsg = '';
    // Логіка надання бонусів за донат: бонуси сортуються за мінімальною сумою від найбільшої.
    // Користувач отримує найкращий доступний бонус, який покривається його сумою.
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

      if (req.io) {
        const message = `${user.username} зробив внесок ${amount} грн на збір "${fundraiser.title}"`;
        await Activity.create({ message, type: 'donation_made' });
        req.io.emit('activity_feed', { message });
      }
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

/**
 * Retrieves all fundraisers for administrative review.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of all fundraisers.
 */
export const getAllFundraisersAdmin = async (req, res) => {
  try {
    const fundraisers = await Fundraiser.find({})
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(fundraisers);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Updates a specific fundraiser.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the updated fundraiser.
 */
export const updateFundraiser = async (req, res) => {
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

/**
 * Adds a final report to a closed fundraiser.
 *
 * @param {import('express').Request} req - The Express request object containing the report description and files.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the updated fundraiser.
 */
export const addFundraiserReport = async (req, res) => {
  try {
    const fundraiser = await Fundraiser.findById(req.params.id);
    if (!fundraiser) return res.status(404).json({ msg: 'Збір не знайдено' });

    if (fundraiser.status === 'open') {
      return res.status(400).json({ msg: 'Не можна додати звіт до відкритого збору' });
    }

    const { reportDescription } = req.body;
    if (!reportDescription || !reportDescription.trim()) {
      return res.status(400).json({ msg: 'Опис звіту є обов\'язковим' });
    }

    const imageUrls = req.files ? req.files.map(f => f.path) : [];

    fundraiser.report = {
      description: reportDescription.trim(),
      images: imageUrls,
      reportedAt: new Date(),
    };
    fundraiser.status = 'reported';
    await fundraiser.save();

    if (req.io) {
      const message = `Звіт по збору "${fundraiser.title}" опубліковано!`;
      await Activity.create({ message, type: 'fundraiser_reported' });
      req.io.emit('activity_feed', { message });
    }

    res.json(fundraiser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Помилка на сервері');
  }
};

/**
 * Deletes a specific fundraiser.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming deletion.
 */
export const deleteFundraiser = async (req, res) => {
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
