const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataPath = path.join(__dirname, '../data/database.json');

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

// Get inventory status (low stock alerts)
router.get('/status', (req, res) => {
  const data = readData();
  const lowStockProducts = data.products.filter(p => p.quantity < 10);
  
  res.json({
    totalProducts: data.products.length,
    lowStockCount: lowStockProducts.length,
    lowStockProducts
  });
});

module.exports = router;