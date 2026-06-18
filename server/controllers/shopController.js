import RewardItem from '../models/RewardItem.js';
import User from '../models/User.js';

/**
 * Retrieves all active items available in the shop.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of active reward items.
 */
export const getAllItems = async (req, res) => {
  try {
    const items = await RewardItem.find({ isActive: true });
    res.json(items);
  } catch (err) {
    console.error('Error fetching shop items:', err);
    res.status(500).json({ msg: 'Помилка сервера при завантаженні товарів' });
  }
};

/**
 * Creates a new item in the shop.
 * Only administrators can perform this action.
 *
 * @param {import('express').Request} req - The Express request object containing item details.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response with the created item.
 */
export const createItem = async (req, res) => {
  try {
    const { title, price, description, type, promoCode } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Доступ заборонено. Тільки для адміністраторів.' });
    }

    // За замовчуванням кількість товару (stock) встановлюється на -1, що означає безкінечний запас.
    const newItem = new RewardItem({
      name: title,
      price: price,
      description: description,
      type: type || 'partner_coupon',
      imageUrl: req.file ? req.file.path : null,
      promoCode: promoCode || '',
      isActive: true,
      stock: req.body.stock || -1 
    });

    await newItem.save();
    res.status(201).json({ msg: 'Бонус успішно створено!', item: newItem });
  } catch (err) {
    console.error('Error creating shop item:', err);
    res.status(500).json({ msg: 'Помилка сервера при створенні бонусу' });
  }
};

/**
 * Processes a user's purchase of a shop item.
 * Deducts coins, updates inventory, and grants the specific reward.
 *
 * @param {import('express').Request} req - The Express request object containing the item ID.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON response confirming the purchase.
 */
export const buyItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Користувача не знайдено' });
    }

    const item = await RewardItem.findById(itemId);
    if (!item || !item.isActive) {
      return res.status(404).json({ msg: 'Товар не знайдено або він недоступний' });
    }

    if (item.stock === 0) {
      return res.status(400).json({ msg: 'Товар закінчився' });
    }

    if ((user.coins || 0) < item.price) {
      return res.status(400).json({ msg: 'Недостатньо монет ImpactCoins' });
    }

    user.coins -= item.price;

    // Логіка управління запасами: якщо stock більше 0, товар лімітований, тому зменшуємо його кількість на 1 при покупці.
    if (item.stock > 0) {
      item.stock -= 1;
      await item.save();
    }

    if (item.type === 'partner_coupon') {
      const code = item.promoCode || `COUPON-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      user.rewards.push({
        type: item.type,
        name: item.name,
        code: code,
        source: 'Shop',
        date: new Date()
      });
    } else if (item.type === 'frame') {
      if (!user.profileCustomization) {
        user.profileCustomization = {};
      }
      user.profileCustomization.avatarFrame = item.name.toLowerCase().replace(/\s+/g, '_');
    } else if (item.type === 'badge') {
      const hasBadge = user.badges.some(b => b.badgeId === item._id.toString());
      if (!hasBadge) {
        user.badges.push({
          badgeId: item._id.toString(),
          level: 1,
          name: item.name,
          icon: item.imageUrl || '🏅',
          date: new Date()
        });
      }
    }

    await user.save();

    res.json({
      msg: 'Покупка успішна!',
      currentCoins: user.coins,
      code: item.type === 'partner_coupon' ? user.rewards[user.rewards.length - 1].code : null,
      user
    });

  } catch (err) {
    console.error('Error buying item:', err);
    res.status(500).json({ msg: 'Помилка сервера при покупці' });
  }
};
