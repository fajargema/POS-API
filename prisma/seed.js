require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/db.js');

async function main() {
    console.log(`Start seeding ...`);
    
    // Hash password once to use for all test accounts
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);

    // 1. Create Owner User
    const owner = await prisma.user.upsert({
        where: { email: 'owner@test.com' },
        update: {},
        create: {
            email: 'owner@test.com',
            name: 'The Boss',
            password: defaultPassword,
            role: 'OWNER'
        }
    });
    console.log(`Created Owner: ${owner.email}`);

    // 2. Create Accountant User
    const accountant = await prisma.user.upsert({
        where: { email: 'accountant@test.com' },
        update: {},
        create: {
            email: 'accountant@test.com',
            name: 'Alice Accountant',
            password: defaultPassword,
            role: 'ACCOUNTANT'
        }
    });
    console.log(`Created Accountant: ${accountant.email}`);

    // 3. Create Cashier User
    const cashier = await prisma.user.upsert({
        where: { email: 'cashier@test.com' },
        update: {},
        create: {
            email: 'cashier@test.com',
            name: 'Charlie Cashier',
            password: defaultPassword,
            role: 'CASHIER'
        }
    });
    console.log(`Created Cashier: ${cashier.email}`);
    
    // 4. Create Category
    const category = await prisma.category.upsert({
        where: { name: 'Coffee' },
        update: {},
        create: {
            name: 'Coffee',
            description: 'Hot and cold coffee beverages'
        }
    });
    console.log(`Created Category: ${category.name}`);

    // 5. Create Products
    const espresso = await prisma.product.upsert({
        where: { name: 'Espresso' },
        update: {},
        create: {
            name: 'Espresso',
            price: 2.50,
            stock: 100,
            categoryId: category.id
        }
    });
    const latte = await prisma.product.upsert({
        where: { name: 'Latte' },
        update: {},
        create: {
            name: 'Latte',
            price: 4.00,
            stock: 50,
            categoryId: category.id
        }
    });
    console.log(`Created Products: ${espresso.name}, ${latte.name}`);

    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
