import { DateTime } from "luxon";

interface PrettyTimeOptions {
  timezone?: string;
  format?: string;
}

export function prettyTime(
  time: string | number | Date | DateTime,
  options?: PrettyTimeOptions
) {
  // get list of timezones
  let dt, timeInt;
  let timezones = Intl.supportedValuesOf("timeZone");
  const timezone = options?.timezone || "local";
  const format = options?.format || "yyyy-MM-dd HH:mm:ss";

  // check if time is a string
  if (typeof time === "string") {
    timeInt = parseInt(time);
  } else if (typeof time === "number") {
    timeInt = time;
  } else if (time instanceof Date) {
    timeInt = time.getTime() / 1000;
  } else if (time instanceof DateTime) {
    timeInt = time.toSeconds();
  } else {
    timeInt = DateTime.local().toSeconds();
  }

  // check if the timezone is valid
  if (timezones.includes(timezone)) {
    dt = DateTime.fromSeconds(timeInt, { zone: timezone });
  } else {
    dt = DateTime.fromSeconds(timeInt, { zone: "local" });
  }

  return dt.toFormat(format);
}
