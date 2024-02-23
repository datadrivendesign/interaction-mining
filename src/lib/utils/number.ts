import { format } from "d3-format";

export function prettyNumber(number: number): string {
  // Create formatter using D3.js
  const formatter = format(".2s"); // .2s means shortened suffix format with 2 significant digits
  return formatter(number).toUpperCase(); // Format number and convert to uppercase
}
