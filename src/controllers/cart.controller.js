const prisma = require('../config/db');

// Get current user's cart (or create one if it doesn't exist)
const getCart = async (req, res, next) => {
    try {
        const cashierId = req.user.id;
        
        // Find existing or create an empty one
        let cart = await prisma.cart.findUnique({
            where: { cashierId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { cashierId },
                include: { items: { include: { product: true } } }
            });
        }

        // Calculate a running total for convenience
        let cartTotal = 0;
        cart.items.forEach(item => {
            cartTotal += item.product.price * item.quantity;
        });

        res.status(200).json({ success: true, data: { ...cart, cartTotal } });
    } catch (error) {
        next(error);
    }
};

// Add item to cart
const addToCart = async (req, res, next) => {
    try {
        const cashierId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        if (!productId || quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid product or quantity' });
        }

        // Check product exists and has stock
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${product.stock} items left in stock` });
        }

        // Get or create cart
        let cart = await prisma.cart.findUnique({ where: { cashierId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { cashierId } });
        }

        // Check if item already exists in cart limits
        const existingItem = await prisma.cartItem.findFirst({
            where: { cartId: cart.id, productId }
        });

        let cartItem;
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({ success: false, message: `Cannot add more. Stock limit: ${product.stock}` });
            }

            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
                include: { product: true }
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity },
                include: { product: true }
            });
        }

        res.status(200).json({ success: true, message: 'Added to cart', data: cartItem });
    } catch (error) {
        next(error);
    }
};

// Update existing cart item quantity
const updateCartItem = async (req, res, next) => {
    try {
        const { id } = req.params; // CartItem ID
        const { quantity } = req.body;

        if (quantity <= 0) {
             return res.status(400).json({ success: false, message: 'Quantity must be greater than 0. Use DELETE to remove.' });
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { product: true, cart: true }
        });

        if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found' });
        
        // Security check
        if (cartItem.cart.cashierId !== req.user.id) {
             return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        // Stock check
        if (cartItem.product.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${cartItem.product.stock} items left in stock` });
        }

        const updated = await prisma.cartItem.update({
            where: { id },
            data: { quantity },
            include: { product: true }
        });

        res.status(200).json({ success: true, message: 'Cart updated', data: updated });
    } catch (error) {
        next(error);
    }
};

// Remove from cart
const removeFromCart = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { cart: true }
        });

        if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found' });
        if (cartItem.cart.cashierId !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });

        await prisma.cartItem.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        next(error);
    }
};

// Clear entire cart
const clearCart = async (req, res, next) => {
    try {
        const cashierId = req.user.id;
        const cart = await prisma.cart.findUnique({ where: { cashierId } });
        
        if (cart) {
            await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
        res.status(200).json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};
