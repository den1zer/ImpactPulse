export const LEVELS = [
  { level: 1, name: 'Новобранець', threshold: 0 },
  { level: 2, name: 'Дослідник', threshold: 100 },
  { level: 3, name: 'Ентузіаст', threshold: 300 },
  { level: 4, name: 'Активіст', threshold: 600 },
  { level: 5, name: 'Провідник', threshold: 1000 },
  { level: 6, name: 'Лідер', threshold: 1500 },
  { level: 7, name: 'Герой', threshold: 2500 }
];

/**
 * Calculates the level and progress based on given points.
 * @param {number} points - The user's points (XP).
 * @returns {Object} - Object containing current level details and progress to next level.
 */
export function calculateLevelData(points) {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1] || null;

  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].threshold) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  let progress = 100; // If max level, progress is 100%
  let pointsNeeded = 0;

  if (nextLevel) {
    const pointsInCurrentLevel = points - currentLevel.threshold;
    const pointsRequiredForNextLevel = nextLevel.threshold - currentLevel.threshold;
    progress = (pointsInCurrentLevel / pointsRequiredForNextLevel) * 100;
    pointsNeeded = nextLevel.threshold - points;
  }

  return {
    currentLevelNumber: currentLevel.level,
    currentLevelName: currentLevel.name,
    nextLevelNumber: nextLevel ? nextLevel.level : null,
    progress: Math.min(Math.max(progress, 0), 100), // Ensure between 0 and 100
    pointsNeeded
  };
}

/**
 * Updates the user's level based on their points/xp.
 * Intended to be used as a service function before saving the user document.
 * @param {Object} user - The mongoose user document.
 * @returns {boolean} - Returns true if the level changed, false otherwise.
 */
export function updateUserLevel(user) {
  // Use xp if available, otherwise fallback to points (assuming we are transitioning or using them interchangeably)
  const experiencePoints = user.xp !== undefined ? user.xp : user.points;
  const levelData = calculateLevelData(experiencePoints);
  
  if (user.level !== levelData.currentLevelNumber) {
    user.level = levelData.currentLevelNumber;
    return true; // Level changed
  }
  return false;
}

