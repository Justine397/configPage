const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../rowData.json');

const testData = {
    test: 'This is a test',
    date: new Date()
};

fs.writeFile(filePath, JSON.stringify(testData, null, 2), 'utf8', (err) => {
    if (err) {
        console.error('Error writing test file:', err);
    } else {
        console.log('Test file written successfully.');
    }
});
