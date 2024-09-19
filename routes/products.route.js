const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productsController = require('../controllers/products.controller');
const productsMiddleware = require('../middlewares/products.middleware');
const tokenMiddleware = require('../middlewares/token.middleware');
const allowTo = require('../middlewares/role.middleware');

// تكوين multer لتخزين الملفات
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split('/')[1];
    const fileName = `img-${Date.now()}.${ext}`;
    cb(null, fileName);
  }
});

// فلتر للملفات المقبولة
const upload = multer({
  storage: diskStorage,
  fileFilter: function (req, file, cb) {
    const fileType = file.mimetype.split('/')[0];
    if (fileType === 'image') return cb(null, true);
    const error = new Error('Invalid file type');
    error.status = 400;
    cb(error, false);
  }
});

// مسارات المنتجات
router.route('/')
  .get(productsController.getProducts)
  .post(tokenMiddleware, upload.array('images', 5), productsMiddleware.middlewareBody, productsController.createProduct);

router.route('/:id')
  .get(productsController.getProductById)
  .delete(tokenMiddleware, allowTo('admin'), productsController.deleteProduct);

module.exports = router;
