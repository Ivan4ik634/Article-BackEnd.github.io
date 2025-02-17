import jwt from 'jsonwebtoken';
//import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import UserSchema from '../models/User.js';
export const register = async (req, res) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json(errors.array());
    // }

    const password = req.body.password;
    const sait = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, sait);

    const doc = new UserSchema({
      email: req.body.email,
      passwordHash,
      fullName: req.body.fullName,
    });

    const user = await doc.save();
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );
    res.json({
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Не вдалось зареєструватись',
    });
    console.log(error);
  }
};
export const login = async (req, res) => {
  try {
    const user = await UserSchema.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'Юзер не найден' });
    }
    const IsPassValid = await bcrypt.compare(req.body.password, user._doc.passwordHash);
    if (!IsPassValid) {
      return res.status(404).json({ message: 'Пароль або логін не вспівпадають' });
    }
    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );
    res.json({ token });
  } catch (error) {
    res.status(400).json({
      message: 'Не вдалося увійти',
    });
  }
};
