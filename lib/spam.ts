const fs = require("fs");
const path = require("path");

import { Message, MessageType, is_structured_header } from "./Message";
import { SyntaxError, parse } from "./message-parser";

const dir = "/home/gene/Maildir/.JunkDuck/cur";
// const dir = "/mnt/ephemeral/jmrp-emails";
// const dir = "/tmp/Maildir/tmp";

let total_messages = 0;
let privacy_weekly = 0;
let otp = 0;
let start_using = 0;

let by_day: Record<number, number> = {};
let by_complainer: Record<string, number> = {};
let by_day_by_complainer: Record<number, Record<string, number>> = {};

const x_hmxmroriginalrecipient_hdr_name = "X-HmXmrOriginalRecipient";
const received_hdr_name = "Received";

function proc_data(data: Buffer, filepath: string) {
  let msg = new Message(
    Buffer.from(`${x_hmxmroriginalrecipient_hdr_name}: <unknown@duck.com>\r\n\r\n\r\n`),
    MessageType.part
  );

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
      if (ignore_if_empty.includes(hdr_name) && !/[^ \t\r\n]/.test(hdr.value)) continue;
      if (!hdr.parsed) {
        // Fix the ones we can:
        switch (hdr.name.toLowerCase()) {
          case "to":
          case "cc":
          case "bcc":
            if (hdr.full_header.length > 998) {
              const fixed = hdr.full_header.replace(/\r?\n /g, "");
              try {
                hdr.parsed = parse(fixed);
              } catch (e) {}
              if (hdr.parsed) {
                hdr.full_header = fixed;
                continue;
              }
            }
        }

        if (!ignore.includes(hdr_name)) {
          console.error(`###### file: ${filepath}`);
          console.error(`###### parse failed for: ${hdr.name}`);
          console.error(hdr);
        }
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

    const complainer_hdr = msg.hdr_idx[x_hmxmroriginalrecipient_hdr_name.toLowerCase()];
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
        const x: Record<string, number> = { [complainer]: 1 };
        by_day_by_complainer[day] = x;
      }
    }
    // have we found our own Received: header?
    var found = false;
    const received_hdr = msg.hdr_idx[received_hdr_name.toLowerCase()];
    if (received_hdr) {
      for (const rec of received_hdr) {
        const by = rec?.parsed?.tokens?.by;
        if (by && by.match(/smtp-inbound1.duck.com \(Haraka\/\d.\d+.\d+\)/)) {
          found = true;
        }
      }
    }
    if (!found) {
      const from = msg.hdr_idx["from"];
      const subj = msg.hdr_idx["subject"];
      if (
        from &&
        from[0]?.value === "DuckDuckGo <dax@mailer.spreadprivacy.com>" &&
        subj &&
        subj[0]?.value?.match(/\[ DuckDuckGo Privacy Weekly \] For .+/)
      ) {
        privacy_weekly += 1;
      } else if (
        from &&
        from[0]?.value === "DuckDuckGo <support@duck.com>" &&
        subj &&
        subj[0]?.value === "Your DuckDuckGo One-time Passphrase"
      ) {
        otp += 1;
      } else if (
        from &&
        from[0]?.value === "DuckDuckGo <support@goduckgo.com>" &&
        subj &&
        subj[0]?.value === "Start using your Duck Address"
      ) {
        start_using += 1;
      } else if (
        from &&
        from[0]?.value === "DuckDuckGo <support@duck.com>" &&
        subj &&
        subj[0]?.value === "Start using your Duck Address"
      ) {
        start_using += 1;
      } else {
        if (from !== undefined && subj !== undefined) {
          console.log(`#### from: `, from);
          console.log(`#### subj: `, subj);
          console.log(`#### untouched: ${filepath}`);
        }
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

let N = 20;
let i = 0;
console.log(`=== top ${N} overall ===`);
for (const complainer of complainers_sorted) {
  if (by_complainer[complainer] < 5) break;
  console.log(complainer, Array(40 - complainer.length).join(" "), by_complainer[complainer]);
  if (++i === N) break;
}
console.log();

console.log("=== count by day ===");
for (const day of Object.keys(by_day)) {
  const dayno = Number(day);
  console.log(day_number_to_date(dayno), "\t", by_day[dayno]);
}
console.log();

N = 10;
console.log(`=== top ${N} by day ===`);
for (const day of Object.keys(by_day_by_complainer)) {
  const dayno = Number(day);
  console.log(day_number_to_date(dayno));
  console.log();

  const by_day_by_complainer_keys = Object.keys(by_day_by_complainer[dayno]);
  const sorted = by_day_by_complainer_keys.sort(function (a, b) {
    return by_day_by_complainer[dayno][b] - by_day_by_complainer[dayno][a];
  });
  let i = 0;
  for (const complainer of sorted) {
    console.log(complainer, Array(40 - complainer.length).join(" "), by_day_by_complainer[dayno][complainer]);
    if (++i === N) break;
  }
  console.log();
}

console.log(`${total_messages} total messages processed`);
console.log(`${otp} One Time password`);
console.log(`${privacy_weekly} Privacy Weekly`);
console.log(`${start_using} Start using your Duck Address `);
