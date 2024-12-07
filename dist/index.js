"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongodb_1 = require("mongodb");
require("dotenv").config();
const app = (0, express_1.default)();
const port = 5000;
// middilware
const corsOptions = {
    // origin: 'http://localhost:3000', // Replace frontend link
    origin: 'https://tech-deal-nextjs.vercel.app', // Replace frontend link
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)());
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const uri = process.env.DB_URL;
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            // collections
            const productsCollection = client.db("teach-deal").collection("test");
            const categoriesCollection = client.db("teach-deal").collection("categories");
            const usersCollection = client.db("teach-deal").collection("users");
            const ordersCollection = client.db('teach-deal').collection("orders");
            app.post('/process-order', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { product, buyerEmail } = req.body;
                const newProduct = { model: product.model, productId: product._id, sellerEmail: product.sellerEmail, buyerEmail, productImg: product.img, price: product.price };
                const result = yield ordersCollection.insertOne(newProduct);
                res.send(result);
            }));
            app.get('/orders/:email', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const { email } = req.params;
                const result = yield ordersCollection.find({ buyerEmail: email }).toArray();
                res.send(result);
            }));
            // users endPoint
            app.post("/register", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { name, email, password, photoURL, role } = req.body;
                    // Check if the user already exists
                    const existingUser = yield usersCollection.findOne({ email });
                    if (existingUser) {
                        return res.status(400).json({ message: "User already exists" });
                    }
                    // Create a new user
                    const newUser = {
                        name,
                        email,
                        password,
                        photoURL,
                        role,
                        createdAt: new Date(),
                    };
                    const result = yield usersCollection.insertOne(newUser);
                    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
                }
                catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }));
            // get all users 
            app.get('/users', (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const results = yield usersCollection.find({}, {
                        projection: { name: 1, email: 1, _id: 1, photoURL: 1, role: 1, createdAt: 1 }
                    }).toArray();
                    res.send(results);
                }
                catch (error) {
                    res.send({ message: "500 Error " });
                }
            }));
            // Post New Product
            app.post('/add-product', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const product = req.body;
                const results = yield productsCollection.insertOne(product);
                res.send(results); // todo highly structure response data
            }));
            // end-point for all Products
            app.get("/products", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const products = yield productsCollection.find().toArray();
                    // console.log(products);
                    res.send(products);
                }
                catch (error) {
                    res.send({ message: "500 Error " });
                }
            }));
            // Search-Products
            app.get('/Search-products', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const query = req.query.query;
                const result = yield productsCollection.find({ model: { $regex: query, $options: 'i' } }).toArray();
                res.send(result);
            }));
            // Get Specific product by ID
            app.get("/products/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const productId = req.params.id;
                    console.log(productId);
                    const product = yield productsCollection.findOne({ _id: new mongodb_1.ObjectId(productId) });
                    if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                    }
                    res.json(product);
                }
                catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }));
            // Seller Added Products edit Update
            app.put('/api/seller/updateProduct/:productid', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const productId = req.params.productid;
                const updatedProduct = req.body;
                delete updatedProduct._id;
                try {
                    const result = yield productsCollection.findOneAndUpdate({ _id: new mongodb_1.ObjectId(productId) }, { $set: updatedProduct });
                    res.json({ message: "Product Updated Succesfully" });
                }
                catch (error) {
                    res.json({ message: error });
                }
            }));
            //Get Product by email for seller
            app.get('/api/seller/myproducts/:email', (req, res) => __awaiter(this, void 0, void 0, function* () {
                // console.log(req.params.email);
                try {
                    const email = req.params.email;
                    const sellerProducts = yield productsCollection.find({ sellerEmail: email }).toArray();
                    // if(!sellerProducts){
                    //   return res.status(1000).json({message:"Products not avaible right now. please add new Produts"})
                    // }
                    res.json(sellerProducts);
                }
                catch (error) {
                    res.status(500).json({ text: "Internal Server Error" });
                }
            }));
            // get currentUserRole
            app.get('/api/auth/:email', (req, res) => __awaiter(this, void 0, void 0, function* () {
                const email = req.params.email;
                try {
                    const user = yield usersCollection.findOne({ email: email });
                    res.json(user);
                }
                catch (error) {
                    res.json({});
                }
            }));
            // categories Information
            app.get('/categories', (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const categories = yield categoriesCollection.find().toArray();
                    res.send(categories);
                }
                catch (error) {
                    res.status(500).json({ message: "Internal server error" });
                }
            }));
            // fetch data by category
            app.get('/categoriesProducts/:category', (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const category = req.params.category;
                    const products = yield productsCollection.find({ category }).toArray();
                    res.json(products);
                }
                catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }));
            // just update all products
            // Endpoint to update all products with status: "publish"
            app.put("/update-products-status", (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const updateResult = yield productsCollection.updateMany({}, { $set: { status: "publish" } });
                    res.status(200).json({
                        message: `${updateResult.modifiedCount} products updated with status: "publish"`,
                    });
                }
                catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal server error" });
                }
            }));
            // Send a ping to confirm a successful connection
            yield client.db("admin").command({ ping: 1 });
            app.listen(port, () => {
                console.log(`[server]: Server is running at http://localhost:${port}`);
            });
        }
        finally {
        }
    });
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Hey Welcome your server is running so good");
});
