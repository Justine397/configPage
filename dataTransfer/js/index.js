document.addEventListener('DOMContentLoaded', function() {
  const selectDatabase = document.getElementById('selectDatabase');
  const selectTable = document.getElementById('selectTable');
  const selectParameter = document.getElementById('selectParameter');
  const selectUCL = document.getElementById('selectUCL');
  const selectLCL = document.getElementById('selectLCL');
  const selectEquipment = document.getElementById('selectEquipment'); // Add this line
  const btnSave = document.querySelector('.btn-save');
  const addParameterButton = document.getElementById('addParameterButton');
  const addUCLButton = document.getElementById('addUCLButton');
  const addLCLButton = document.getElementById('addLCLButton');

  function addNewSelect(selectElement) {
      const newFormGroup = document.createElement('div');
      newFormGroup.classList.add('form-group2');

      const newSelect = document.createElement('select');
      newSelect.classList.add('form-control');

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '⤷ ' + selectElement.id;
      newSelect.appendChild(defaultOption);

      const closeButton = document.createElement('button');
      closeButton.classList.add('close-button');
      closeButton.textContent = 'x';
      closeButton.addEventListener('click', function() {
          newFormGroup.remove();
      });

      newFormGroup.appendChild(newSelect);
      newFormGroup.appendChild(closeButton);

      if (selectElement === selectParameter) {
          document.getElementById('parameterSection').appendChild(newFormGroup);
      } else if (selectElement === selectUCL) {
          document.getElementById('uclSection').appendChild(newFormGroup);
      } else if (selectElement === selectLCL) {
          document.getElementById('lclSection').appendChild(newFormGroup);
      }

      newSelect.addEventListener('change', function() {
          if (newSelect.value !== '') {
              defaultOption.remove();
          } else {
              newSelect.insertBefore(defaultOption, newSelect.firstChild);
          }
      });

      fetchColumns(selectDatabase.value, selectTable.value, newSelect);

      return newSelect;
  }

  addParameterButton.addEventListener('click', function() {
      addNewSelect(selectParameter);
  });

  addUCLButton.addEventListener('click', function() {
      addNewSelect(selectUCL);
  });

  addLCLButton.addEventListener('click', function() {
      addNewSelect(selectLCL);
  });

  function fetchDatabases() {
      fetch('php/fetchDB.php')
          .then(response => response.json())
          .then(data => {
              populateSelect(selectDatabase, data);
          })
          .catch(error => {
              console.error('Error fetching databases:', error);
          });
  }

  function fetchTables(databaseName) {
      if (databaseName) {
          fetch(`php/fetchTables.php?database=${encodeURIComponent(databaseName)}`)
              .then(response => response.json())
              .then(data => {
                  populateSelect(selectTable, data);
              })
              .catch(error => {
                  console.error(`Error fetching tables for ${databaseName}:`, error);
              });
      } else {
          selectTable.innerHTML = '<option value="">⤷ Select Table</option>';
      }
  }

  function fetchColumns(databaseName, tableName, selectElement) {
      if (databaseName && tableName) {
          fetch(`php/fetchColumns.php?database=${encodeURIComponent(databaseName)}&table=${encodeURIComponent(tableName)}`)
              .then(response => response.json())
              .then(data => {
                  populateSelect(selectElement, data);
              })
              .catch(error => {
                  console.error(`Error fetching columns for ${tableName}:`, error);
              });
      } else {
          selectElement.innerHTML = '<option value="">⤷ Select Columns</option>';
      }
  }

  function fetchEquipment(databaseName, tableName) {
      if (databaseName && tableName) {
          fetch(`php/fetchEquipment.php?database=${encodeURIComponent(databaseName)}&table=${encodeURIComponent(tableName)}`)
              .then(response => response.json())
              .then(data => {
                  populateSelect(selectEquipment, data);
              })
              .catch(error => {
                  console.error(`Error fetching equipment for ${tableName}:`, error);
              });
      } else {
          selectEquipment.innerHTML = '<option value="">⤷ Select Equipment</option>';
      }
  }

  function populateSelect(selectElement, options) {
      const selectedValue = selectElement.value;

      selectElement.innerHTML = '';

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = `⤷ ${selectElement.id}`;
      selectElement.appendChild(defaultOption);

      options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option;
          optionElement.textContent = option;
          selectElement.appendChild(optionElement);
      });

      if (selectedValue) {
          selectElement.value = selectedValue;
      }
  }

  fetchDatabases();

  selectDatabase.addEventListener('change', function() {
      const selectedDatabase = selectDatabase.value;
      fetchTables(selectedDatabase);
  });

  selectTable.addEventListener('change', function() {
      const selectedDatabase = selectDatabase.value;
      const selectedTable = selectTable.value;
      
      fetchEquipment(selectedDatabase, selectedTable);
  });

  selectEquipment.addEventListener('change', function() { // Add this event listener
      const selectedDatabase = selectDatabase.value;
      const selectedTable = selectTable.value;
      
      fetchColumns(selectedDatabase, selectedTable, selectParameter);
      fetchColumns(selectedDatabase, selectedTable, selectUCL);
      fetchColumns(selectedDatabase, selectedTable, selectLCL);
  });

  btnSave.addEventListener('click', function() {
    const selectedDatabase = selectDatabase.value;
    const selectedTable = selectTable.value;
    const selectedEquipment = selectEquipment.value; // Add this line
    const selectedParameter = collectSelectedValues('parameterSection');
    const selectedUCL = collectSelectedValues('uclSection');
    const selectedLCL = collectSelectedValues('lclSection');

    const selectedData = {
        database: selectedDatabase,
        table: selectedTable,
        equipment: selectedEquipment, // Add this line
        parameter: selectedParameter,
        ucl: selectedUCL,
        lcl: selectedLCL
    };

    const jsonData = JSON.stringify(selectedData);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'php/saveData.php');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Configuration successfully Saved!');
        } else {
            alert('Failed to save configuration.');
        }
    };
    xhr.send(jsonData);
    refreshTable();
});


  function collectSelectedValues(sectionId) {
      const selectElements = document.querySelectorAll(`#${sectionId} .form-control`);
      const selectedValues = Array.from(selectElements)
          .map(select => select.value)
          .filter(value => value !== '');

      return selectedValues;
  }

  document.getElementById('insert-data-btn').addEventListener('click', () => {
      const socket = new WebSocket('ws://localhost:8080');
      alert('Data successfully inserted on server!');

      socket.addEventListener('open', () => {
          console.log('WebSocket connection established.');
          socket.send(JSON.stringify({ action: 'insertData' }));
      });

      socket.addEventListener('message', (event) => {
          console.log('Received message from server:', event.data);
      });

      socket.addEventListener('close', () => {
          console.log('WebSocket connection closed.');
      });

      socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
      });
  });
});
