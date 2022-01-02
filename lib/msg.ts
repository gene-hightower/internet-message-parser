const fs = require('fs');
const path = require('path');

import { Message, is_structured_header } from "./Message";

const dir = '/home/gene/Maildir/.FB/cur';
//const dir = '/home/gene/Maildir/.Junk/cur';
//const dir = '/home/gene/Maildir/cur';
//const dir = '/tmp/Maildir/cur';

var count_messages = 0;
var count_multipart = 0;

var msg = new Message(Buffer.from(''));

for (const filename of fs.readdirSync(dir)) {

  const filepath = path.resolve(dir, filename);

  const stat = fs.statSync(filepath);
  const isFile = stat.isFile();

  try {
    if (isFile) {
      // console.log(`${filepath}`);
      const data = fs.readFileSync(filepath);

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
        "authentication-results",
        "message-id",
        "received",
        "references",
        "return-path",
      ];
      // Ignore if empty, as is often the case.
      const ignore_if_empty = [
        "cc",
        "in-reply-to",
        "reply-to",
      ];

      for (const hdr of msg.headers) {
        const hdr_name = hdr.name.toLowerCase();
        if (!is_structured_header(hdr_name))
          continue;
        if (ignore.includes(hdr_name))
          continue;
        if (ignore_if_empty.includes(hdr_name) && !/[^ \t\r\n]/.test(hdr.value))
          continue;
        if (!hdr.parsed) {
          console.error(`###### file: ${filepath}`);
          console.error(`###### parse failed for: ${hdr.name}`);
        }
      }

      const ct = msg.hdr_idx["content-type"];
      const mv = msg.hdr_idx["mime-version"];

      if (ct && !mv) {
        // console.error(`###### file: ${filepath}`);
        // console.error(`###### Content-Type: with no MIME-Version:`);
      }

      if (ct && ct[0].parsed?.type === 'multipart') {
        count_multipart += 1;

        console.log(`----- Multipart file: ${filepath} -----`);
        if (msg.preamble) {
          console.log(`preamble found`);
        }
        if (msg.parts) {
          console.log(`${msg.parts.length} parts found`);

          for (const part of msg.parts) {
            console.log(`-----`);
            for (const hdr of part.headers) {
              console.log(`${hdr.name}: ${hdr.value}`);
            }
          }
        }
        if (msg.epilogue) {
          console.log(`epilogue found`);
        }
      }

      count_messages += 1;
    }
  } catch (ex) {
    console.error(ex);
  }
}

console.log(`${count_messages} messages processed`);
console.log(`${count_multipart} multipart messages`);
