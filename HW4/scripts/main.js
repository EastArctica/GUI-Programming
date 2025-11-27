const multForm = document.getElementById('multiplication-form');
const xStartElem = multForm.querySelector('#x-start');
const xEndElem = multForm.querySelector('#x-end');
const yStartElem = multForm.querySelector('#y-start');
const yEndElem = multForm.querySelector('#y-end');
const resultElem = document.querySelector('#result');
const alertContainer = document.getElementById('alert-container');

multForm.addEventListener('submit', function (event) {
  event.preventDefault();
  console.log('Multiplication form submitted');

  // Clear any previous alerts
  alertContainer.innerHTML = '';

  // Reset table
  [...resultElem.children].forEach((child) => child.remove());

  const xStart = parseInt(xStartElem.value, 10);
  const xEnd = parseInt(xEndElem.value, 10);
  const yStart = parseInt(yStartElem.value, 10);
  const yEnd = parseInt(yEndElem.value, 10);

  // Check if table size exceeds 50,000 cells
  const totalCells = Math.abs(xEnd - xStart) * Math.abs(yEnd - yStart);
  if (totalCells > 50000) {
    showAlert(
      'Warning: Table size is very large (' +
        totalCells.toLocaleString() +
        ' cells). This may cause performance issues!',
      'warning'
    );
    return;
  }

  const table = createTable(xStart, xEnd, yStart, yEnd);
  resultElem.appendChild(table);

  // Log inputs to console
  console.log({
    xStart,
    xEnd,
    yStart,
    yEnd
  });
});

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
