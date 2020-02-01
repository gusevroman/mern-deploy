const { Router } = require('express');
const bcrypt = require('bcryptjs'); // шифрование пароля
const config = require('config');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator'); // модуль валидации
const User = require('../modules/User');

const router = Router();

// метод для регистрации
// /api/auth/register
router.post('/register',
  [ // массив валидаторов
    check('email', 'Incorrect email').isEmail(),
    check('password', 'Minimum password length 6 symbols').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req); // валидирует входяшие поля

      if (!errors.isEmpty()) { // если есть ошибки, то на фронт передается сообщение вида:
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrect registration data',
        });
      }

      const { email, password } = req.body;
      const candidate = await User.findOne({ email });
      if (candidate) {
        res.status(400).json({ message: 'Such email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({ email, password: hashedPassword });
      await user.save();

      req.status(201).json({ message: 'User created' });
    } catch (e) {
      res.status(500).json({ message: 'Something went wrong, try again' });
    }
  });

  
// /api/auth/login
router.post('/login',
  [ // массив валидаторов
    check('email', 'Enter correct email').normalizeEmail().isEmail(),
    check('password', 'Enter password').exists(),
  ],
  async (req, res) => {
    try {
      //  валидирует входяшие поля
      const errors = validationResult(req);

      // если есть ошибки, то на фронт передается сообщение вида:
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Incorrecе data for login',
        });
      }

      // получить из request поля email and password
      const { email, password } = req.body;
      const user = await User.findOne({ email }); // ищем пользователя в базе

      // если пользователь не найден, то формируется json с message error
      if (!user) {
        return res.status(400).json({ message: 'User is not found' });
      }

      // проверка совпадают ли пароли пользователя
      // обращаемся к bycrypt который позволяет сравнивать захешированные пароли
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password, try again' });
      }

      // формирование токена
      const token = jwt.sign(
        { userId: user.id },
        config.get('jwtSecret'), // по сути строка зависящая от настроек
        { expiresIn: '1h' }, // время жизни токена
      );

      // ответ пользователю
      res.json({ token, userId: user.id });
    } catch (e) {
      res.status(500).json({ message: 'Something went wrong, try again' });
    }
  });

module.exports = router;
