/**
 * How to lay out a strip of tabs: `null` if they fit in one row, otherwise the
 * number of columns of the grid with the fewest rows that fits.
 *
 * `widths` are each tab's narrowest width, `rowSpacing` is the total width of
 * the spacers between them in one row, and `gap` is the gap between columns of
 * the grid. The grid's columns share the width evenly, but none is narrower
 * than its widest tab (as in CSS grid's `1fr`). Tabs fill the grid by rows, so
 * seven tabs in two rows are four and three.
 */
export function chooseTabColumns(
  widths: number[],
  rowSpacing: number,
  gap: number,
  available: number,
): number | null {
  // measured widths can be a fraction of a pixel out
  const fits = (needed: number) => needed <= available + 0.5;
  if (fits(widths.reduce((sum, width) => sum + width, 0) + rowSpacing)) {
    return null;
  }
  for (let rows = 2; rows < widths.length; rows++) {
    const columns = Math.ceil(widths.length / rows);
    let needed = (columns - 1) * gap;
    for (let column = 0; column < columns; column++) {
      let widest = 0;
      for (let i = column; i < widths.length; i += columns) {
        widest = Math.max(widest, widths[i]);
      }
      needed += widest;
    }
    if (fits(needed)) {
      return columns;
    }
  }
  return 1;
}
