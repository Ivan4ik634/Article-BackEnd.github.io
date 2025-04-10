import { body } from 'express-validator';
export const validatorRegister = [
  body('email', 'Невірна почта!').isEmail(),
  body('password', 'Пароль має бути з 5 буквами!').isLength({ min: 5 }),
  body('fullName', "Ім'я має бути з 3-ма буквами!").isLength({ min: 3 }),
];
export const validatorEdit = [
  body('fullName', "Ім'я має бути з 3-ма буквами!").isLength({ min: 3 }),
  body('biograffy').isLength({ min: 0 }),
];
export const validatorPassword = [
  body('PasswordNew', 'Пароль має бути з 5 буквами!').isLength({ min: 5 }),
  ,
];
export const acticleValidation = [
  body('title', 'Заголовок має бути з 3-ма буквами!').isLength({ min: 3 }),
  body('text', 'Текст має бути з 3-ма буквами!').isLength({ min: 3 }),
  body('tags', 'Тег має бути з 3-ма буквами!').isLength({ min: 3 }),
  body('imgURL', 'Неправильна силка').optional().isString(),
];
export const validatorComment = [
  body('text', 'Текст має бути з 3-ма буквами!').isLength({ min: 3 }),
];
