const fs = require("fs");
const path = require("path");

import { Message, MessageType, is_structured_header } from "./Message";
import { SyntaxError, parse } from "./message-parser";

const dir = "/mnt/ephemeral/jmrp-emails";

let total_messages = 0;

let by_day: Record<number, number> = {};
let by_complainer: Record<string, number> = {}
let by_day_by_complainer: Record<number, Record<string, number>> = {}

const x_hmxmroriginalrecipient = "X-HmXmrOriginalRecipient";

function proc_data(data: Buffer, filepath: string)
{
  let msg = new Message(Buffer.from(`${x_hmxmroriginalrecipient}: <unknown@duck.com>\r\n\r\n\r\n`), MessageType.part);

  try {
      try {
        msg = new Message(data);
      } catch (ex) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### Message() failed: ${ex}`);
      }

      if (!msg.body) {
        console.error(`###### No body for: ${filepath}`);
        // continue;
      }

      // Structured headers to ignore, often malformed.
      const ignore = [
        // prettier-ignore
        "authentication-results",
        "message-id",
        "received",
        "references",
        "return-path",
      ];
      // Ignore if empty, as is often the case.
      const ignore_if_empty = [
        // prettier-ignore
        "cc",
        "in-reply-to",
        "reply-to",
      ];

      for (const hdr of msg.headers) {
        const hdr_name = hdr.name.toLowerCase();
        if (!is_structured_header(hdr_name)) continue;
        if (ignore.includes(hdr_name)) continue;
        if (ignore_if_empty.includes(hdr_name) && !/[^ \t\r\n]/.test(hdr.value)) continue;
        if (!hdr.parsed) {
          // Fix the ones we can:
            if (hdr.name.toLowerCase() == "to" && hdr.full_header.length > 998) {
                const fixed = hdr.full_header.replace(/\r?\n /g, "");
                try {
                    hdr.parsed = parse(fixed);
                } catch (e) {};
                if (hdr.parsed) {
                    hdr.full_header = fixed;
                    continue;
                }
            }

          console.error(`###### file: ${filepath}`);
          console.error(`###### parse failed for: ${hdr.name}`);
          console.error(hdr);
        }
      }

  } catch (e) {
    const ex = e as NodeJS.ErrnoException;
    console.error(`###### file: ${filepath}`);
    console.error(`###### exception:`);
    console.error(`${ex.message}`);
    console.error(`${ex.code}`);
    console.error(`${ex.stack}`);
  }

  return msg;
}

function day_number(timeMs: number) {
    return Math.floor(timeMs / (24 * 60 * 60 * 1000));
}

function day_number_to_date(day: number) {
    return new Date(day * 24 * 60 * 60 * 1000);
}

function proc(filepath: string) {
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
        for (const filename of fs.readdirSync(filepath)) {
            proc(path.resolve(filepath, filename));
        }
    }
    if (stat.isFile()) {
      const data = fs.readFileSync(filepath);

      const msg = proc_data(data, filepath);
      const day = day_number(stat.birthtimeMs);

      if (by_day[day]) {
        by_day[day] += 1;
      } else {
        by_day[day] = 1;
      }

      const complainer_hdr = msg.hdr_idx[x_hmxmroriginalrecipient.toLowerCase()];
      if (complainer_hdr && complainer_hdr[0].parsed) {
        const complainer = complainer_hdr[0].value;
        if (by_complainer[complainer]) {
          by_complainer[complainer] += 1;
        } else {
          by_complainer[complainer] = 1;
        }

        if (by_day_by_complainer[day]) {
          if (by_day_by_complainer[day][complainer]) {
              by_day_by_complainer[day][complainer] += 1;
          } else {
              by_day_by_complainer[day][complainer] = 1;
          }
        } else {
            const x:Record<string, number> = {complainer: 1};
            by_day_by_complainer[day] = x;
        }
      }

      total_messages += 1;
    }
}

proc(dir);

const complainer_keys = Object.keys(by_complainer);
const complainers_sorted = complainer_keys.sort(function (a, b) {
    return by_complainer[b] - by_complainer[a];
});
for (const complainer of complainers_sorted) {
    if (by_complainer[complainer] < 5)
        break;
    console.log(by_complainer[complainer], "\t", complainer);
}

console.log();

/*
const days_keys = Object.keys(by_day);
const days_sorted = days_keys.sort(function (a, b) {
    return by_day[b] - by_day[a];
});
for (const day of days_sorted) {
    console.log(by_day[day], day);
}
*/

for (const day of Object.keys(by_day)) {
    const dayno = Number(day);
    console.log(day_number_to_date(dayno), "\t", by_day[dayno]);
}

console.log();

for (const day of Object.keys(by_day_by_complainer)) {
    const dayno = Number(day);
    console.log(day_number_to_date(dayno));
    console.log();
    for (const complainer of Object.keys(by_day_by_complainer[dayno])) {
        console.log(complainer, "\t", by_day_by_complainer[dayno][complainer]);
    }
    console.log();
}

console.log();

console.log(`${total_messages} total messages processed`);
