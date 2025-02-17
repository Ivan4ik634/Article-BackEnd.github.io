import jwt from 'jsonwebtoken';
export default (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
  if (token) {
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id;
    next();
  } else {
    res.status(403).json({
      message: 'Нема доступа',
    });
  }
};
