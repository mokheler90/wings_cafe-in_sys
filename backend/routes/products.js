const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // NEW
const router = express.Router();

const dataPath = path.join(__dirname, '../data/database.json');

// NEW: Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// NEW: File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to read data from JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { products: [], sales: [], inventory: [] };
  }
};

// Helper function to write data to JSON file
const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

// Get all products
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.products);
});

// Add a new product (with image upload)
router.post('/', upload.single('image'), (req, res) => {
  try {
    const { name, description, category, price, quantity } = req.body;
    const data = readData();
    
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const newProduct = {
      id: Date.now().toString(),
      name,
      description,
      category,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      imageUrl, // NEW: Store image URL
      createdAt: new Date().toISOString()
    };
    
    data.products.push(newProduct);
    writeData(data);
    
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a product (with optional image upload)
router.put('/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, quantity, currentImage } = req.body;
    const data = readData();
    
    const productIndex = data.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let imageUrl = currentImage || '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      
      // Delete old image if it exists and a new one is uploaded
      if (data.products[productIndex].imageUrl) {
        const oldImagePath = path.join(__dirname, '..', data.products[productIndex].imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    data.products[productIndex] = {
      ...data.products[productIndex],
      name,
      description,
      category,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      imageUrl, // NEW: Update image URL
      updatedAt: new Date().toISOString()
    };
    
    writeData(data);
    res.json(data.products[productIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a product
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  
  const productIndex = data.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // Delete associated image if it exists
  if (data.products[productIndex].imageUrl) {
    const imagePath = path.join(__dirname, '..', data.products[productIndex].imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  
  data.products.splice(productIndex, 1);
  writeData(data);
  
  res.json({ message: 'Product deleted successfully' });
});

module.exports = router;