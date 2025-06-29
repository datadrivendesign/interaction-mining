import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { Platform } from "@/lib/utils";

export function prettyNumber(number: number, os: Platform): string {
  switch (os) {
    case Platform.IOS:
      return prettyNumberIOS(number);
    case Platform.ANDROID:
      return prettyNumberAndroid(number);
    default:
      return number.toString();
  }
}


function prettyNumberIOS(number: number): string {
  const formatString: string = ".2f"
  // Create formatter using D3.js
  const formatter = format(formatString); // .2s means shortened suffix format with 2 significant digits
  return formatter(number); // Format number and convert to uppercase
}

function prettyNumberAndroid(number: number): string {
  const formatString: string = "%M:%S"
  // Convert Unix timestamp to milliseconds
  const date = new Date(number);
  // Create formatter using D3.js
  const formatter = timeFormat(formatString);
  // Format the date as minutes:seconds
  return formatter(date);
}
