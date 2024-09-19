const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  info: {
    SKU: {
      type: String,
      required: true
    },
    Availability: {
      type: String,
      enum: ['In Stock', 'Out of Stock'],
      required: true
    },
    Brand: {
      type: String,
      required: true
    },
    Category: {
      type: String,
      required: true
    }
  },
  price: {
    type: {
      price: {
        type: Number,
        required: true
      },
      oldPrice: {
        type: Number,
        required: false
      },
      off: {
        type: Number,
        required: false
      }
    }
  },
  images: [String], // Array to hold image URLs
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Products = mongoose.model('Product', productSchema);
module.exports = Products;
