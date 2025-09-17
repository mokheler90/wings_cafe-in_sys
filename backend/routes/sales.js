const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = process.env.DATABASE_FILE || path.join(__dirname, '../data/database.json');


// Helper functions (same as in products.js)
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { products: [], sales: [], inventory: [] };
  }
};

const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// Record a sale
router.post('/', (req, res) => {
  const { productId, quantity, totalAmount } = req.body;
  const data = readData();
  
  // Find the product
  const product = data.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // Check if enough stock is available
  if (product.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }
  
  // Update product quantity
  product.quantity -= parseInt(quantity);
  
  // Record the sale
  const newSale = {
    id: Date.now().toString(),
    productId,
    productName: product.name,
    quantity: parseInt(quantity),
    totalAmount: parseFloat(totalAmount),
    date: new Date().toISOString()
  };
  
  data.sales.push(newSale);
  writeData(data);
  
  res.status(201).json(newSale);
});

// Get all sales
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.sales);
});

// Get recent sales (last 10)
router.get('/recent', (req, res) => {
  const data = readData();
  const recentSales = data.sales
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  
  res.json(recentSales);
});

module.exports = router;
