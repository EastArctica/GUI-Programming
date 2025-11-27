const multForm = document.getElementById('multiplication-form');
const xStartElem = multForm.querySelector('#x-start');
const xEndElem = multForm.querySelector('#x-end');
const yStartElem = multForm.querySelector('#y-start');
const yEndElem = multForm.querySelector('#y-end');
const resultElem = document.querySelector('#result');

multForm.addEventListener('submit', function (event) {
  event.preventDefault();
  console.log('Multiplication form submitted');

  // Reset table
  [...resultElem.children].forEach((child) => child.remove());

  const xStart = parseInt(xStartElem.value, 10);
  const xEnd = parseInt(xEndElem.value, 10);
  const yStart = parseInt(yStartElem.value, 10);
  const yEnd = parseInt(yEndElem.value, 10);
  const table = new MultiplicationTable(xStart, xEnd, yStart, yEnd);
  table.render(resultElem);

  // HW Requirement: Log inputs to console
  console.log({
    xStart,
    xEnd,
    yStart,
    yEnd
  });
});

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

const CELL_WIDTH = 52;
const CELL_HEIGHT = 32;
// A multiplication table class that only renders a portion of the table based on scroll position
class MultiplicationTable {
  // Max cells rendered at once
  MAX_CELLS = 1000;
  MAX_X = 25; //window.innerWidth / CELL_WIDTH;
  MAX_Y = 25; //window.innerHeight / CELL_HEIGHT;
  lastScroll = 0;

  constructor(xStart, xEnd, yStart, yEnd) {
    this.xStart = xStart;
    this.xEnd = xEnd;
    this.yStart = yStart;
    this.yEnd = yEnd;
  }

  createTableChunk(xStart, xEnd, yStart, yEnd) {
    const cells = [];
    for (let x = xStart; x < xEnd; x++) {
      for (let y = yStart; y < yEnd; y++) {
        const cell = document.createElement('td');
        cell.style.position = 'absolute';
        // Position relative to the table start positions
        cell.style.top = (y - this.yStart) * CELL_HEIGHT + 'px';
        cell.style.left = (x - this.xStart) * CELL_WIDTH + 'px';
        cell.innerText = x * y; // Show actual multiplication result
        cell.id = `cell_${x}_${y}`;
        cells.push(cell);
      }
    }

    return cells;
  }

  createTable() {
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const cells = this.createTableChunk(
      this.xStart,
      this.xEnd - this.xStart > this.MAX_X ? this.MAX_X : this.xEnd,
      this.yStart,
      this.yEnd - this.yStart > this.MAX_Y ? this.MAX_Y : this.yEnd
    );
    cells.forEach((cell) => headerRow.appendChild(cell));
    table.appendChild(headerRow);
    return table;
  }

  render(elem) {
    // Delete existing table if any
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }

    const tableContainer = document.createElement('div');
    tableContainer.style.height =
      CELL_HEIGHT * Math.max(this.yEnd - this.yStart + 1, this.MAX_Y) + 'px';
    tableContainer.style.width =
      CELL_WIDTH * Math.max(this.xEnd - this.xStart + 1, this.MAX_X) + 'px';
    tableContainer.appendChild(this.createTable());

    elem.appendChild(tableContainer);

    elem.addEventListener('scroll', () => this.onScroll(elem));
    this.onScroll(elem);
  }

  onScroll(elem) {
    if (this.lastScroll && Date.now() - this.lastScroll < 50) {
      return;
    }
    this.lastScroll = Date.now();
    console.clear();

    const table = elem.querySelector('table');
    const elemHeight = elem.clientHeight;
    const scrollTop = elem.scrollTop;
    const scrollLeft = elem.scrollLeft;

    // Find all cells that should be visible from scrollTop to scrollTop + elemHeight
    const firstVisibleRow = Math.floor(scrollTop / CELL_HEIGHT);
    const lastVisibleRow = Math.ceil((scrollTop + elemHeight) / CELL_HEIGHT);
    console.log('Visible rows:', firstVisibleRow, lastVisibleRow);

    // Find all cells that should be visible from scrollLeft to scrollLeft + elemWidth
    const firstVisibleCol = Math.floor(scrollLeft / CELL_WIDTH);
    const lastVisibleCol = Math.ceil(
      (scrollLeft + elem.clientWidth) / CELL_WIDTH
    );
    console.log('Visible cols:', firstVisibleCol, lastVisibleCol);

    const cells = this.createTableChunk(
      this.xStart + firstVisibleCol,
      this.xStart + lastVisibleCol,
      firstVisibleRow,
      lastVisibleRow
    );

    cells.forEach((cell) => {
      const existingCell = document.getElementById(cell.id);
      if (!existingCell) {
        table.appendChild(cell);
      }
    });

    // Delete out of view cells
    [...table.children].forEach((child) => {
      const cellTop = parseInt(child.style.top, 10);
      const cellBottom = cellTop + CELL_HEIGHT;
      const cellLeft = parseInt(child.style.left, 10);
      const cellRight = cellLeft + CELL_WIDTH;
      if (
        cellBottom < scrollTop ||
        cellTop > scrollTop + elemHeight ||
        cellRight < scrollLeft ||
        cellLeft > scrollLeft + elem.clientWidth
      ) {
        table.removeChild(child);
      }
    });

    console.log(`Rendering ${[...table.children].length} cells`);
  }
}
