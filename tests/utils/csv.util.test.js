const { convertToCSV } = require('../../src/utils/csv.util');

describe('CSV Utility', () => {
    const columns = [
        { header: 'Name', key: 'name' },
        { header: 'Price', key: 'price' },
        { header: 'Stock', key: 'stock' }
    ];

    it('should convert array of objects to CSV', () => {
        const data = [
            { name: 'Nasi Goreng', price: 25000, stock: 50 },
            { name: 'Mie Ayam', price: 15000, stock: 30 }
        ];
        const csv = convertToCSV(data, columns);
        const lines = csv.split('\n');
        expect(lines[0]).toBe('Name,Price,Stock');
        expect(lines[1]).toBe('Nasi Goreng,25000,50');
        expect(lines[2]).toBe('Mie Ayam,15000,30');
    });

    it('should handle empty data array', () => {
        const csv = convertToCSV([], columns);
        expect(csv).toBe('Name,Price,Stock');
    });

    it('should escape values with commas', () => {
        const data = [{ name: 'Nasi Goreng, Spesial', price: 30000, stock: 10 }];
        const csv = convertToCSV(data, columns);
        expect(csv).toContain('"Nasi Goreng, Spesial"');
    });

    it('should escape values with quotes', () => {
        const data = [{ name: 'Nasi "Special"', price: 30000, stock: 10 }];
        const csv = convertToCSV(data, columns);
        expect(csv).toContain('"Nasi ""Special"""');
    });

    it('should handle null/undefined values as empty strings', () => {
        const data = [{ name: 'Test', price: null, stock: undefined }];
        const csv = convertToCSV(data, columns);
        const lines = csv.split('\n');
        expect(lines[1]).toBe('Test,,');
    });
});
