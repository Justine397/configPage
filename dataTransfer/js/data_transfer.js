const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const mysql = require('mysql');

let readConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: '',
};

const writeConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sensor_db'
};

const readConnection = mysql.createConnection(readConfig);
const writeConnection = mysql.createConnection(writeConfig);

let latestInsertedNo = 0;
let saveData = [];
let clients = [];

const server = http.createServer((req, res) => {
    fs.readFile('TableDisplay.html', (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading file');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Client connected');
    clients.push(ws);

    ws.on('message', message => {
        console.log('Received:', message);

        try {
            const data = JSON.parse(message);

            if (data.action === 'insertData') {
                console.log('Triggering data insertion...');
                fetchAndInsertLatestData((error) => {
                    if (error) {
                        console.error('Error fetching and inserting data:', error);
                        ws.send(JSON.stringify({ status: 'error', message: 'Data insertion failed' }));
                    } else {
                        console.log('Data insertion completed successfully.');
                        ws.send(JSON.stringify({ status: 'success', message: 'Data insertion successful' }));
                    }
                });
            }
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

function updateReadConfig(callback) {
    fs.readFile('../saveData.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading saveData.json:', err);
            callback(err);
            return;
        }

        try {
            const newData = JSON.parse(data);
            if (!Array.isArray(newData)) {
                throw new Error('Invalid data format in saveData.json');
            }
            console.log('Updated saveData:', newData);
            saveData = newData;
            callback(null, saveData);
        } catch (error) {
            console.error('Error parsing saveData.json:', error);
            callback(error);
        }
    });
}

function fetchAndInsertLatestData(callback) {
    if (saveData.length === 0) {
        console.log('No configuration data available.');
        callback(null);
        return;
    }

    let processedDataCount = 0;
    let allData = [];

    function processNextDataSet() {
        if (processedDataCount >= saveData.length) {
            rowDataJson(allData, (error) => {
                if (error) {
                    callback(error);
                } else {
                    console.log('rowData.json updated successfully.');
                    broadcastToClients(allData);
                    insertDataIntoSensorDB(allData, (error) => {
                        if (error) {
                            callback(error);
                        } else {
                            console.log('Data inserted into sensor_db successfully.');
                            callback(null);
                        }
                    });
                }
            });
            return;
        }

        const { database, table, equipment, parameter, ucl, lcl } = saveData[processedDataCount];

        const selectColumns = [
            ...parameter.map(param => `${param} AS ${param}`),
            ...ucl.map(col => `${col} AS UCL_${col}`),
            ...lcl.map(col => `${col} AS LCL_${col}`),
            `${database}.${table}.No AS No`, 
            `${database}.${table}.EquipmentNo AS equipmentNo`
        ];

        // Add a WHERE clause to filter by the selected equipment
        const query = `
            SELECT ${selectColumns.join(', ')}
            FROM ${database}.${table}
            WHERE EquipmentNo = '${equipment}'  -- Filter by equipmentNo
            ORDER BY No DESC
            LIMIT 1`;

        readConnection.query(query, (error, results) => {
            if (error) {
                callback(error);
                return;
            }

            if (results.length > 0) {
                const latestNoFetched = results[0].No;

                const data = {
                    equipmentNo: results[0].equipmentNo,
                    parameter: parameter,
                    value: parameter.map(param => results[0][param]),
                    ucl: ucl.map(col => results[0][`UCL_${col}`]),
                    lcl: lcl.map(col => results[0][`LCL_${col}`]),
                    table: table
                };

                if (latestNoFetched > latestInsertedNo) {
                    allData.push(data);
                    latestInsertedNo = latestNoFetched;
                } else {
                    allData.push(data);
                }
            } else {
                console.log(`No results fetched for dataset ${processedDataCount}.`);
            }
            
            processedDataCount++;
            processNextDataSet();
        });
    }

    processNextDataSet();
}

function insertDataIntoSensorDB(dataArray, callback) {
    const insertValues = dataArray.flatMap(data => {
        const { equipmentNo, parameter, value, ucl, lcl } = data;
        return parameter.map((param, index) => {
            return [equipmentNo, param, value[index], ucl[index], lcl[index]];
        });
    });

    if (insertValues.length === 0) {
        console.log('No valid data to insert.');
        callback(null);
        return;
    }

    const query = `
        INSERT INTO dht11 (equipmentNo, parameter, value, ucl, lcl)
        VALUES ?`;

    writeConnection.query(query, [insertValues], (error) => {
        if (error) {
            console.error('Error inserting data:', error);
            callback(error);
        } else {
            console.log(`Inserted ${insertValues.length} sets of data.`);
            callback(null);
        }
    });
}


function rowDataJson(dataArray, callback) {
    fs.writeFile('../rowData.json', JSON.stringify(dataArray, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Error writing rowData.json:', err);
            callback(err);
        } else {
            console.log('rowData.json updated.');
            callback(null);
        }
    });
}

function insertDataIntoSensorDB(dataArray, callback) {
    const insertValues = dataArray.flatMap(data => {
        const { equipmentNo, parameter, value, ucl, lcl } = data;
        return parameter.map((param, index) => {
            return [equipmentNo, param, value[index], ucl[index], lcl[index]];
        });
    });

    if (insertValues.length === 0) {
        console.log('No valid data to insert.');
        callback(null);
        return;
    }

    const query = `
        INSERT INTO dht11 (equipmentNo, parameter, value, ucl, lcl)
        VALUES ?`;

    writeConnection.query(query, [insertValues], (error) => {
        if (error) {
            console.error('Error inserting data:', error);
            callback(error);
        } else {
            console.log(`Inserted ${insertValues.length} sets of data.`);
            callback(null);
        }
    });
}

function broadcastToClients(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

const watchOptions = {
    persistent: true,
    interval: 500
};

fs.watch('../saveData.json', watchOptions, (eventType) => {
    if (eventType === 'change') {
        console.log('saveData.json has been updated');
        updateReadConfig((err) => {
            if (err) {
                console.error('Error updating readConfig:', err);
                return;
            }
            fetchAndInsertLatestData((error) => {
                if (error) {
                    console.error('Error fetching and inserting data:', error);
                }
            });
        });
    }
});

updateReadConfig((err) => {
    if (err) {
        console.error('Error updating readConfig:', err);
        return;
    }
});

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});