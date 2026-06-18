import Skin from '../models/Skin.js';

/**
 * Retrieves all available UI skins/themes.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} Returns a JSON array of skins.
 */
export const getAllSkins = async (req, res) => {
  try {
    const skins = await Skin.find();
    res.json(skins);
  } catch (err) {
    res.status(500).send('Помилка на сервері');
  }
};