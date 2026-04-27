import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const PRIZES = [
  { label: '+50 XP',        xp: 50,   chance: 35 },
  { label: '+100 XP',       xp: 100,  chance: 25 },
  { label: '+200 XP',       xp: 200,  chance: 15 },
  { label: '+500 XP',       xp: 500,  chance: 10 },
  { label: 'Бейдж Удача',   badge: 'lucky_wheel', chance: 8 },
  { label: 'Рамка Золота',  frame: 'gold',        chance: 5 },
  { label: '🎰 Джекпот 1000 XP', xp: 1000,       chance: 2 },
];

router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let canSpin = true;
    let nextSpinDate = null;

    if (user.wheelLastSpun) {
      const lastSpun = new Date(user.wheelLastSpun);
      nextSpinDate = new Date(lastSpun.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() < nextSpinDate) {
        canSpin = false;
      }
    }

    res.json({ canSpin, nextSpinDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/spin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.wheelLastSpun) {
      const nextSpinDate = new Date(new Date(user.wheelLastSpun).getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() < nextSpinDate) {
        return res.status(403).json({ message: 'You can only spin the wheel once a week' });
      }
    }

    // Weighted random selection
    const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.chance, 0);
    let randomNum = Math.random() * totalWeight;
    let selectedPrizeIndex = 0;

    for (let i = 0; i < PRIZES.length; i++) {
      if (randomNum < PRIZES[i].chance) {
        selectedPrizeIndex = i;
        break;
      }
      randomNum -= PRIZES[i].chance;
    }

    const prize = PRIZES[selectedPrizeIndex];

    // Apply prize
    if (prize.xp) {
      user.points += prize.xp;
    }
    if (prize.badge) {
      const hasBadge = user.badges.find(b => b.badgeId === prize.badge);
      if (!hasBadge) {
        user.badges.push({
          badgeId: prize.badge,
          level: 1,
          name: 'Удача на колесі',
          icon: '🍀'
        });
      }
    }
    if (prize.frame) {
      user.profileCustomization.avatarFrame = prize.frame;
    }

    user.wheelLastSpun = new Date();
    await user.save();

    res.json({ prizeIndex: selectedPrizeIndex, prize });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
