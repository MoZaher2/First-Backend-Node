const { validationResult } = require('express-validator');
const Products = require('../models/products.model');

let getProducts = async (req, res) => {
  try {
    const { limit = 2, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const products = await Products.find().limit(limit).skip(skip);
    res.json({ status: 'success', data: { products } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Unable to fetch products' });
  }
};

let getProductById = async (req, res) => {
  try {
    const product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: `Product with id ${req.params.id} not found` });
    }
    res.json({ status: 'success', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Unable to fetch product' });
  }
};

let createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'fail', data: { error: errors.array() } });
  }

  try {
    // هنا يتم تعيين مسار الصور من req.files
    const imageUrls = req.files.map(file => `${process.env.BASE_URL}/uploads/${file.filename}`);

    const product = new Products({
      ...req.body,
      images: imageUrls
    });

    await product.save();
    res.status(201).json({ status: 'success', data: { product }, message: 'Product added successfully' });
  } catch (err) {
    console.error(err); // يمكن أن يساعد في التشخيص
    res.status(500).json({ status: 'error', message: 'Unable to add product' });
  }
};



let deleteProduct = async (req, res) => {
  try {
    const product = await Products.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: `Product with id ${req.params.id} not found` });
    }
    res.json({ status: 'success', message: `Product with id ${req.params.id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Unable to delete product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  deleteProduct
};
