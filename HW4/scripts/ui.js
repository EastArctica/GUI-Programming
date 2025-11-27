const alertContainer = document.getElementById('alert-container');
let tabCounter = 2; // Start from 2 since 1 is the input tab

$(document).ready(function () {
  // Initialize Tabs
  const tabs = $('#tabs').tabs();

  // Initialize Validation
  const form = $('#multiplication-form');
  form.validate({
    rules: {
      'x-start': { required: true, number: true, min: -100, max: 100 },
      'x-end': { required: true, number: true, min: -100, max: 100 },
      'y-start': { required: true, number: true, min: -100, max: 100 },
      'y-end': { required: true, number: true, min: -100, max: 100 }
    },
    messages: {
      'x-start': {
        required: 'Please enter a start value for X.',
        number: 'Please enter a valid number.',
        min: 'Min -100',
        max: 'Max 100'
      },
      'x-end': {
        required: 'Please enter an end value for X.',
        number: 'Please enter a valid number.',
        min: 'Min -100',
        max: 'Max 100'
      },
      'y-start': {
        required: 'Please enter a start value for Y.',
        number: 'Please enter a valid number.',
        min: 'Min -100',
        max: 'Max 100'
      },
      'y-end': {
        required: 'Please enter an end value for Y.',
        number: 'Please enter a valid number.',
        min: 'Min -100',
        max: 'Max 100'
      }
    },
    errorElement: 'div',
    errorPlacement: function (error, element) {
      error.addClass('error-message');
      error.insertAfter(element.parent()); // Insert after the input-group
    },
    submitHandler: function (form) {
      addTab();
      return false;
    }
  });

  // Initialize Sliders and Two-Way Binding
  const sliders = [
    { id: 'x-start', min: -100, max: 100 },
    { id: 'x-end', min: -100, max: 100 },
    { id: 'y-start', min: -100, max: 100 },
    { id: 'y-end', min: -100, max: 100 }
  ];

  sliders.forEach((item) => {
    const sliderId = `#slider-${item.id}`;
    const inputId = `#${item.id}`;

    $(sliderId).slider({
      min: item.min,
      max: item.max,
      value: parseInt($(inputId).val()) || 0,
      slide: function (event, ui) {
        $(inputId).val(ui.value);
        if (form.valid()) {
          updateLivePreview();
        }
      }
    });

    $(inputId).on('input change', function () {
      const val = parseInt($(this).val());
      if (!isNaN(val) && val >= item.min && val <= item.max) {
        $(sliderId).slider('value', val);
      }
      if (form.valid()) {
        updateLivePreview();
      }
    });
  });

  // Initial Live Preview
  if (form.valid()) {
    updateLivePreview();
  }

  // Delete Tab Functionality
  tabs.on('click', 'span.ui-icon-close', function () {
    const panelId = $(this).closest('li').remove().attr('aria-controls');
    $('#' + panelId).remove();
    tabs.tabs('refresh');
  });

  // Delete All Tabs
  $('#delete-all-tabs').on('click', function () {
    // Remove all tabs except the first one
    $('#tabs ul li:not(:first-child)').remove();
    // Remove all tab panels except the first one (tabs-1)
    $('#tabs > div:not(#tabs-1)').remove();
    tabs.tabs('refresh');
  });

  // Delete Selected Tabs
  $('#delete-selected-tabs').on('click', function () {
    $('#tabs ul li:not(:first-child)').each(function () {
      if ($(this).find('.tab-checkbox').is(':checked')) {
        const panelId = $(this).remove().attr('aria-controls');
        $('#' + panelId).remove();
      }
    });
    tabs.tabs('refresh');
  });
});

function updateLivePreview() {
  const xStart = parseInt($('#x-start').val(), 10);
  const xEnd = parseInt($('#x-end').val(), 10);
  const yStart = parseInt($('#y-start').val(), 10);
  const yEnd = parseInt($('#y-end').val(), 10);

  const resultElem = document.querySelector('#result .table-container');
  if (!resultElem) return;

  // Reset table
  [...resultElem.children].forEach((child) => child.remove());

  // Check if table size exceeds 50,000 cells
  const totalCells = Math.abs(xEnd - xStart) * Math.abs(yEnd - yStart);
  if (totalCells > 50000) {
    resultElem.innerHTML =
      '<p class="error-message">Table too large to preview.</p>';
    return;
  }

  const table = createTable(xStart, xEnd, yStart, yEnd);
  resultElem.appendChild(table);
}

function addTab() {
  const xStart = parseInt($('#x-start').val(), 10);
  const xEnd = parseInt($('#x-end').val(), 10);
  const yStart = parseInt($('#y-start').val(), 10);
  const yEnd = parseInt($('#y-end').val(), 10);

  const label = `[${xStart}, ${xEnd}] x [${yStart}, ${yEnd}]`;
  const id = 'tabs-' + tabCounter;

  const li = `<li><a href="#${id}">${label}</a> <span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span> <input type="checkbox" class="tab-checkbox" title="Select to delete"></li>`;
  const tabs = $('#tabs');

  tabs.find('.ui-tabs-nav').append(li);

  // Create content
  const table = createTable(xStart, xEnd, yStart, yEnd);
  const div = $(`<div id="${id}"></div>`);
  div.append(table);

  tabs.append(div);
  tabs.tabs('refresh');
  tabs.tabs('option', 'active', tabCounter - 1);

  tabCounter++;
}

function createTable(xStart, xEnd, yStart, yEnd) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');

  const emptyTh = document.createElement('th');
  emptyTh.textContent = '';
  headerRow.appendChild(emptyTh);

  let minValue = xStart * yStart;
  let maxValue = xStart * yStart;

  let x = xStart + (xStart < xEnd ? -1 : 1);
  while (xStart < xEnd ? x < xEnd : x > xEnd) {
    x += xStart < xEnd ? 1 : -1;

    const th = document.createElement('th');
    th.textContent = x;
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  let y = yStart + (yStart < yEnd ? -1 : 1);
  while (yStart < yEnd ? y < yEnd : y > yEnd) {
    y += yStart < yEnd ? 1 : -1;
    const row = document.createElement('tr');
    const rowHeader = document.createElement('th');
    rowHeader.textContent = y;
    row.appendChild(rowHeader);
    let xInner = xStart + (xStart < xEnd ? -1 : 1);
    while (xStart < xEnd ? xInner < xEnd : xInner > xEnd) {
      xInner += xStart < xEnd ? 1 : -1;
      const cell = document.createElement('td');
      cell.textContent = y * xInner;
      row.appendChild(cell);

      if (y * xInner < minValue) {
        minValue = y * xInner;
      }
      if (y * xInner > maxValue) {
        maxValue = y * xInner;
      }
    }
    table.appendChild(row);
  }

  // Go over all cells to apply coloring based on min and max values
  [...table.rows].forEach((row, rowIndex) => {
    [...row.cells].forEach((cell, cellIndex) => {
      // Skip header cells
      if (rowIndex === 0 || cellIndex === 0) return;

      const cellValue = parseInt(cell.textContent, 10);
      const amount = (cellValue - minValue) / (maxValue - minValue);
      const color = lerpColor('#00ff00', '#ff0000', amount);
      cell.style.backgroundColor = color;
    });
  });

  return table;
}

function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-' + type;
  alertDiv.textContent = message;
  alertContainer.appendChild(alertDiv);
}

function lerpColor(a, b, amount) {
  const ar = parseInt(a.slice(1, 3), 16),
    ag = parseInt(a.slice(3, 5), 16),
    ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16),
    bg = parseInt(b.slice(3, 5), 16),
    bb = parseInt(b.slice(5, 7), 16);
  const rr = ar + amount * (br - ar);
  const rg = ag + amount * (bg - ag);
  const rb = ab + amount * (bb - ab);
  return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb).toString(16).slice(1)}`;
}
