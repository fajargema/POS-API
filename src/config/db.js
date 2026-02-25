const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;

// Configure the pg pool
const pool = new Pool({ 
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000 
});

// Instantiate the Prisma pg adapter
const adapter = new PrismaPg(pool);

// Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
