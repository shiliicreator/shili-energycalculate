// Массив, в котором храним все добавленные приборы
    let devices = [];

    // Селекторы элементов формы
    const deviceForm = document.getElementById('device-form');
    const deviceNameInput = document.getElementById('deviceName');
    const usageHoursInput = document.getElementById('usageHours');
    const powerInput = document.getElementById('power');
    const pricePerKwhInput = document.getElementById('pricePerKwh');
    const hoursErrorSpan = document.getElementById('hours-error');

    // Кнопки
    const calculateBtn = document.getElementById('calculateBtn');
    const addDeviceBtn = document.getElementById('addDeviceBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Таблица
    const tableContainer = document.getElementById('table-container');
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    /* 
      Проверка корректности ввода для поля "Время использования (часов)".
      Если пользователь вводит число > 24, просим ввести корректное значение.
    */
    usageHoursInput.addEventListener('input', () => {
      const value = Number(usageHoursInput.value);
      if (value > 24) {
        usageHoursInput.value = 24;
        hoursErrorSpan.textContent = 'Максимум 24 часа в сутки!';
      } else {
        hoursErrorSpan.textContent = '';
      }
    });

    /*
      Функция добавляет/обновляет прибор в массиве (если данные корректны),
      затем рендерит таблицу. 
      Параметр skipCalculation может управлять тем, пересчитывать ли сразу 
      значения (по умолчанию пересчитываем).
    */
    function addOrUpdateDevice(skipCalculation = false) {
      // Считываем значения из полей формы
      const name = deviceNameInput.value.trim();
      const hours = Number(usageHoursInput.value);
      const power = Number(powerInput.value);
      const price = Number(pricePerKwhInput.value);

      // Проверка обязательных полей
      if (!name || isNaN(hours) || isNaN(power) || isNaN(price)) {
        return; // Если данные некорректны, не добавляем
      }

      // Создаем объект устройства
      const newDevice = {
        id: Date.now(), // Уникальный ID (для удаления и идентификации)
        name: name,
        usageHours: hours,
        power: power,
        pricePerKwh: price,
        enabled: true // По умолчанию прибор включен в расчёты
      };

      // Добавляем в массив устройств
      devices.push(newDevice);

      // ВАЖНО: согласно требованию, значения в полях сохраняются, поэтому
      // строки очистки формы ниже удалены.
      // deviceNameInput.value = '';
      // usageHoursInput.value = '';
      // powerInput.value = '';
      // pricePerKwhInput.value = '';
      // hoursErrorSpan.textContent = '';

      // Перерисовываем таблицу
      renderTable(skipCalculation ? false : true);
    }

    /*
      Функция для отрисовки (или перерисовки) таблицы 
      с актуальными данными приборов.
    */
    function renderTable(doCalculation = true) {
      // Если нет приборов — скрываем таблицу и выходим
      if (devices.length === 0) {
        tableContainer.style.display = 'none';
        return;
      }

      // Иначе делаем таблицу видимой
      tableContainer.style.display = 'block';

      // Очищаем предыдущую структуру заголовков
      tableHead.innerHTML = '';
      tableBody.innerHTML = '';

      // --------------------------
      // Генерируем заголовок (THEAD)
      // --------------------------

      // Первая строка заголовка: "Период" + по 2 столбца на каждый прибор
      const headerRow = document.createElement('tr');

      // Первый столбец - "Период"
      const periodHeader = document.createElement('th');
      periodHeader.textContent = 'Период';
      headerRow.appendChild(periodHeader);

      // Для каждого прибора создаём 2 столбца:
      // - Потребление (кВт*ч) Прибор N (часов)
      // - Цена (РУБ) Прибор N (часов)
      devices.forEach(device => {
        const consumptionHeader = document.createElement('th');

        // В заголовке укажем название прибора и его пользовательское время,
        // а также чекбокс для включения/отключения и кнопку для удаления.
        consumptionHeader.innerHTML = `
          <div class="device-header-controls">
            Потребление (кВт*ч) 
            <br>
            Прибор ${device.name} (${device.usageHours} ч)
            <input type="checkbox" ${device.enabled ? 'checked' : ''} data-id="${device.id}">
            <button class="delete-device-btn" data-id="${device.id}">&times;</button>
          </div>
        `;
        headerRow.appendChild(consumptionHeader);

        const priceHeader = document.createElement('th');
        priceHeader.innerHTML = `
          Цена (РУБ)
          <br>
          Прибор ${device.name} (${device.usageHours} ч)
        `;
        headerRow.appendChild(priceHeader);
      });

      tableHead.appendChild(headerRow);

      // --------------------------
      // Генерируем тело таблицы (TBODY) - 5 строк
      // --------------------------

      // Список периодов, которые хотим отобразить
      const periods = [
        { label: '1 час', type: 'hour' },
        { label: '1 день', type: 'day' },
        { label: '1 месяц', type: 'month' },
        { label: '1 год', type: 'year' },
        { label: 'Пользовательское время', type: 'custom' }
      ];

      periods.forEach(period => {
        const row = document.createElement('tr');

        // Первая ячейка — название периода
        const periodCell = document.createElement('td');
        periodCell.textContent = period.label;
        row.appendChild(periodCell);

        // Для каждого прибора создаём по 2 ячейки: (Потребление, Цена)
        devices.forEach(device => {
          // Вычисляем потребление и цену
          let consumption = 0; // кВт*ч
          let cost = 0; // Руб

          if (doCalculation && device.enabled) {
            // Преобразуем мощность из Вт в кВт
            const powerKwt = device.power / 1000; 
            
            switch (period.type) {
              case 'hour':
                // 1 час работы
                consumption = powerKwt * 1;
                cost = consumption * device.pricePerKwh;
                break;
              case 'day':
                // За один день (с учетом device.usageHours)
                consumption = powerKwt * device.usageHours;
                cost = consumption * device.pricePerKwh;
                break;
              case 'month':
                // За месяц (30.44 дней)
                consumption = powerKwt * device.usageHours * 30.44;
                cost = consumption * device.pricePerKwh;
                break;
              case 'year':
                // За год (365.25 дней)
                consumption = powerKwt * device.usageHours * 365.25;
                cost = consumption * device.pricePerKwh;
                break;
              case 'custom':
                // "Пользовательское время" – те же device.usageHours
                consumption = powerKwt * device.usageHours;
                cost = consumption * device.pricePerKwh;
                break;
            }
          }

          // Подстановка 0 вместо NaN или Infinity
          if (isNaN(consumption) || !isFinite(consumption)) {
            consumption = 0;
          }
          if (isNaN(cost) || !isFinite(cost)) {
            cost = 0;
          }

          // Ячейка потребления
          const consumptionCell = document.createElement('td');
          consumptionCell.textContent = consumption.toFixed(4);
          row.appendChild(consumptionCell);

          // Ячейка цены
          const costCell = document.createElement('td');
          costCell.textContent = cost.toFixed(2);
          row.appendChild(costCell);
        });

        tableBody.appendChild(row);
      });

      // Добавляем обработчики для чекбоксов (включение/отключение прибора) и кнопок удаления
      const checkboxes = tableHead.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const deviceId = Number(e.target.dataset.id);
          const deviceIndex = devices.findIndex(d => d.id === deviceId);
          if (deviceIndex > -1) {
            devices[deviceIndex].enabled = e.target.checked;
            renderTable(true);
          }
        });
      });

      const deleteButtons = tableHead.querySelectorAll('.delete-device-btn');
      deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const deviceId = Number(e.target.dataset.id);
          devices = devices.filter(d => d.id !== deviceId);
          renderTable(true);
        });
      });
    }

    /*
      При нажатии на "Рассчитать":
      1. Если в форме введены новые данные, добавляем прибор в список.
      2. Сразу считаем (renderTable(true)).
    */
    calculateBtn.addEventListener('click', () => {
      if (
        deviceNameInput.value.trim() !== '' ||
        usageHoursInput.value.trim() !== '' ||
        powerInput.value.trim() !== '' ||
        pricePerKwhInput.value.trim() !== ''
      ) {
        addOrUpdateDevice(false);
      } else {
        renderTable(true);
      }
    });

    /*
      При нажатии на "Добавить прибор":
      1. Добавляем прибор в список.
      2. Пересчитываем таблицу.
    */
    addDeviceBtn.addEventListener('click', () => {
      addOrUpdateDevice(false);
    });

    /*
      При нажатии на "Сбросить":
      1. Очищаем массив устройств.
      2. Очищаем форму (значения полей сбрасываются).
      3. Скрываем таблицу.
    */
    resetBtn.addEventListener('click', () => {
      devices = [];
      deviceForm.reset();
      hoursErrorSpan.textContent = '';
      tableContainer.style.display = 'none';
    });