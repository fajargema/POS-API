/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data - The array of data objects.
 * @param {Array<{header: string, key: string}>} columns - Column definitions.
 * @returns {string} The formatted CSV string.
 */
const convertToCSV = (data, columns) => {
    // Header row
    const headerRow = columns.map(col => escapeCSVValue(col.header)).join(',');

    // Data rows
    const dataRows = data.map(row => {
        return columns.map(col => {
            const value = row[col.key];
            return escapeCSVValue(value !== undefined && value !== null ? String(value) : '');
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
};

/**
 * Escapes a value for safe CSV inclusion.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
const escapeCSVValue = (value) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

/**
 * Sends a CSV response with proper headers.
 * @param {Object} res - Express response object.
 * @param {string} filename - The download filename.
 * @param {string} csvString - The CSV content.
 */
const sendCSVResponse = (res, filename, csvString) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvString);
};

module.exports = { convertToCSV, sendCSVResponse };
