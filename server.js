const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ecommerce', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));



// Set up view engine (if using EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Define your data models (schemas)
const ProductSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String, 
});
const Product = mongoose.model('Product', ProductSchema);


// Home page - display products
app.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        const cart = req.session.cart || [];
        console.log("Session on home page:", req.session);
        res.render('index', { products, cart });
    } catch (error) {
        res.status(500).send('Error fetching products');
    }
});

// Product detail page
app.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('product-detail', { product });
    } catch (error) {
        res.status(500).send('Error fetching product details');
    }
});

// Add to cart route
app.post('/cart/add/:id', async (req, res) => {
    const productId = req.params.id;
    const quantity = parseInt(req.body.quantity) || 1;

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const product = await Product.findById(productId);
        if (product) {
            req.session.cart.push({ productId: product._id, name: product.name, price: product.price, image: product.image, quantity });
        }
    }

    req.session.save(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error adding to cart');
        }
        res.redirect('/cart');
    });
});

// Cart page
app.get('/cart', (req, res) => {
    res.render('cart', { cart: req.session.cart || [] });
});

// Remove from cart route
app.post('/cart/remove/:id', (req, res) => {
    const productIdToRemove = req.params.id;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.productId !== productIdToRemove);
        req.session.save(err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error removing from cart');
            }
            res.redirect('/cart');
        });
    } else {
        res.redirect('/cart');
    }
});

// Checkout route (real payments not included)
app.get('/checkout', (req, res) => {
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    res.render('checkout', { cart: req.session.cart });
    // It will be simple
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// In a real application, you would store user data in a database
const users = [];

app.get('/', (req, res) => {
    res.send('Welcome to the E-commerce Site!');
});

app.get('/register', (req, res) => {
    res.send(`
        <h1>Register</h1>
        <form action="/register" method="POST">
            <input type="text" name="username" placeholder="Username" required><br><br>
            <input type="email" name="email" placeholder="Email" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Register</button>
        </form>
        <p><a href="/login">Already have an account? Login</a></p>
    `);
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

});