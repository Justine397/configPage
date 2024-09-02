let openModalIndex = null;

async function fetchData() {
    try {
        const [saveDataResponse, rowDataResponse] = await Promise.all([
            fetch('./saveData.json'),
            fetch('./rowData.json')
        ]);

        const saveData = await saveDataResponse.json();
        const rowData = await rowDataResponse.json();

        await updateTable(saveData, rowData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function generateTable(saveData, rowData) {
    if (!saveData || !rowData || !saveData.length || !rowData.length) {
        console.error('No data received.');
        return '';
    }

    const tableConfigs = {};

    saveData.forEach(tableConfig => {
        const key = tableConfig.equipment;
        if (key === undefined) {
            console.warn('Undefined equipment key in saveData:', tableConfig);
            return;
        }
        if (!tableConfigs[key]) {
            tableConfigs[key] = {
                parameters: new Set(tableConfig.parameter || []),
                ucl: new Set(tableConfig.ucl || []),
                lcl: new Set(tableConfig.lcl || []),
                entries: []
            };
        } else {
            tableConfig.parameter.forEach(param => tableConfigs[key].parameters.add(param));
            tableConfig.ucl.forEach(ucl => tableConfigs[key].ucl.add(ucl));
            tableConfig.lcl.forEach(lcl => tableConfigs[key].lcl.add(lcl));
        }
    });

    rowData.forEach(entry => {
        const key = entry.equipmentNo;
        if (key === undefined) {
            console.warn('Undefined equipment key in rowData:', entry);
            return;
        }
        if (tableConfigs[key]) {
            tableConfigs[key].entries.push(entry);
        } else {
            console.warn(`No table config found for key: ${key}`);
        }
    });

    const tablesHtml = Object.keys(tableConfigs).map(key => {
        const { entries, parameters, ucl, lcl } = tableConfigs[key];

        const uniqueParameters = Array.from(parameters);
        const uniqueUCL = Array.from(ucl);
        const uniqueLCL = Array.from(lcl);

        const columns = [
            'Action',
            'Table',
            'Equipment No',
            ...uniqueParameters,
            ...uniqueUCL,
            ...uniqueLCL
        ];

        const rowsHtml = entries.map((entry, rowIndex) => {
            const rowValues = [
                `<button class="view-btn" data-index="${rowIndex}" data-key="${key}">🛠️</button>`,
                entry.table,
                entry.equipmentNo,
                ...uniqueParameters.map((param, i) => entry.value[i] || ''),
                ...uniqueUCL.map((name, i) => (entry.ucl && entry.ucl[i] !== undefined ? entry.ucl[i] : '')),
                ...uniqueLCL.map((name, i) => (entry.lcl && entry.lcl[i] !== undefined ? entry.lcl[i] : ''))
            ];

            return `
                <tr>
                    ${rowValues.map(value => `<td>${value}</td>`).join('')}
                </tr>
            `;
        }).join('');

        const tableHeaders = columns.map(column => `<th>${column}</th>`).join('');

        const modalsHtml = entries.map((entry, modalIndex) => {
            const modalParameterHtml = uniqueParameters.map((param, i) => `
                <select class="grid-control">
                    <option value="">${param}</option>
                </select>
                <label>: ${entry.value[i] !== undefined ? entry.value[i] : ''}</label>
            `).join('');

            const modalUclHtml = uniqueUCL.map((name, i) => `
                <select class="grid-control">   
                    <option value="">${name}</option>
                </select>
                <label>: ${entry.ucl[i] !== undefined ? entry.ucl[i] : ''}</label>
            `).join('');

            const modalLclHtml = uniqueLCL.map((name, i) => `
                <select class="grid-control">
                    <option value="">${name}</option>
                </select>
                <label>: ${entry.lcl[i] !== undefined ? entry.lcl[i] : ''}</label>
            `).join('');

            return `
                <div id="modal-${modalIndex}-${key}" class="modal">
                    <div class="modal-content">
                        <span class="close" data-index="${modalIndex}" data-key="${key}">&times;</span>
                        <h2> Row ${modalIndex + 1}</h2>
                        <strong>Table:</strong> ${entry.table}<br>
                        <strong>Equipment No:</strong> ${entry.equipmentNo}<br>
                        <div class="grid-selection">
                            ${modalParameterHtml}
                            ${modalUclHtml}
                            ${modalLclHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="table-container">
                <h4>✦ <i>${key}</i></h4>
                <table>
                    <thead>
                        <tr>${tableHeaders}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                ${modalsHtml}
            </div>
        `;
    }).join('');

    return tablesHtml;
}


async function refreshTable() {
    try {
        const saveDataResponse = await fetch('./saveData.json');
        const rowDataResponse = await fetch('./rowData.json');

        const saveData = await saveDataResponse.json();
        const rowData = await rowDataResponse.json();

        await updateTable(saveData, rowData);
        console.log('Table refreshed successfully.');
    } catch (error) {
        console.error('Error refreshing table:', error);
    }
}

async function updateTable(saveData, rowData) {
    try {
        const tableHtml = await generateTable(saveData, rowData);
        if (tableHtml) {
            const tableContainer = document.getElementById('table-container');
            tableContainer.innerHTML = tableHtml;

            setupModal();

            if (openModalIndex !== null) {
                showModal(openModalIndex);
            }
            console.log('Table updated successfully.');
        } else {
            console.error('Failed to generate table HTML');
        }
    } catch (error) {
        console.error('Error updating table:', error);
    } 
}

function setupModal() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const closeButtons = document.querySelectorAll('.close');

    viewButtons.forEach(button => {
        button.removeEventListener('click', handleViewButtonClick);
        button.addEventListener('click', handleViewButtonClick);
    });

    closeButtons.forEach(button => {
        button.removeEventListener('click', handleCloseButtonClick);
        button.addEventListener('click', handleCloseButtonClick);
    });

    window.addEventListener('click', event => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
            openModalIndex = null;
        }
    });
}

function handleViewButtonClick(event) {
    const index = event.target.dataset.index;
    const key = event.target.dataset.key;
    console.log(`View button clicked for index ${index} with key ${key}`);
    showModal(index, key);
}

function handleCloseButtonClick(event) {
    const index = event.target.dataset.index;
    const key = event.target.dataset.key; 
    console.log(`Close button clicked for index ${index} with key ${key}`);
    closeModal(index, key); 
}


function showModal(index, key) {
    console.log(`Showing modal for index ${index} with key ${key}`);
    const modal = document.querySelector(`#modal-${index}-${key}`);
    if (modal) {
        modal.style.display = 'block';
        openModalIndex = index;
    } else {
        console.error('Modal not found for index:', index);
    }
}

function closeModal(index, key) {
    console.log(`Closing modal for index ${index} with key ${key}`);
    const modal = document.querySelector(`#modal-${index}-${key}`);
    if (modal) {
        modal.style.display = 'none';
        if (openModalIndex === index) {
            openModalIndex = null;
        }
    } else {
        console.error('Modal not found for index:', index);
    }
}


function clearTableRows() {
    if (confirm('Are you sure you want to clear the table? This will also clear saveData.json and rowData.json.')) {
        const tbody = document.getElementById('table-container');
        if (tbody) {
            tbody.innerHTML = '';
            console.log('Table rows cleared.');
        } else {
            console.error('Table body element not found.');
        }

        fetch('php/clear_files.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('JSON files cleared.');
            } else {
                console.error('Failed to clear JSON files:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } else {
        console.log('Table clearing cancelled.');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const clearTableBtn = document.getElementById('clear-table-btn');
    const refreshTableBtn = document.getElementById('refresh-table-btn');

    if (clearTableBtn) {
        clearTableBtn.addEventListener('click', function() {
            clearTableRows();
        });
    } else {
        console.error('Clear Table button not found.');
    }

    if (refreshTableBtn) {
        refreshTableBtn.addEventListener('click', refreshTable);
    } else {
        console.error('Refresh Table button not found.');
    }

    fetchData();
});
