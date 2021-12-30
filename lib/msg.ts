"use strict";

const message = require('../../lib/message');

const fs = require('fs');
const path = require('path');

import { Message } from "./Message";

//const dir = '/home/gene/Maildir/.Junk/cur';
const dir = '/home/gene/Maildir/cur';
//const dir = '/tmp/Maildir/cur';

var count = 0;

const deepFlatten = (arr: any) =>
  [].concat(...arr.map((v: any) => (Array.isArray(v) ? deepFlatten(v) : v)));

function flat_string(d: any) {
  if (d) {
    if (Array.isArray(d))
      return deepFlatten(d).join("");
    return d;
  }
  return "";
}

for (const filename of fs.readdirSync(dir)) {

  const filepath = path.resolve(dir, filename);

  const stat = fs.statSync(filepath);
  const isFile = stat.isFile();

  var msg = new Message(Buffer.from(''));

  try {
    if (isFile) {
      // console.log(`${filepath}`);
      const data = fs.readFileSync(filepath);
      try {
        msg = new Message(data);
      } catch (e) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### regex failed: ${e}`);
      }

      console.log(`###### file: ${filepath}`);

      for (const hdr of msg.headers) {
        if (hdr.name.startsWith("X") || hdr.name.startsWith("x")) {
          continue;             // skip X- fields
        }

        const structured_headers = [
          "accept-language",
          "authentication-results",
          "auto-submitted",
          "bcc",
          "cc",
          "comments",
          "content-description",
          "content-disposition",
          "content-id",
          "content-language",
          "content-location",
          "content-transfer-encoding",
          "content-type",
          "date",
          "from",
          "in-reply-to",
          "keywords",
          "message-id",
          "mime-version",
          "received",
          "references",
          "reply-to",
          "require-recipient-valid-since",
          "resent-bcc",
          "resent-cc",
          "resent-date",
          "resent-from",
          "resent-message-id",
          "resent-sender",
          "resent-to",
          "return-path",
          "sender",
          "subject",
          "to",
        ];
        const key = hdr.name.toLowerCase()
        if (!structured_headers.includes(key)) {
          continue;
        }
        try {
          const results = message.parse(hdr.full_header);
          // message.parse(hdr.full_header);
          // console.log(`${JSON.stringify(results)}`);

          if (results[0] && results[0][0]) {
            if (typeof results[0][0] !== 'string') {
              console.log(flat_string(results[0][0]));
              if (results[0] && results[0][3]) {
                console.log(`${flat_string(results[0][3][0])}`);
              } else {
                console.log(results);
              }
            }
          }
        } catch (e) {
          console.error(`###### file: ${filepath}`);
          console.error(`###### parsing failed: ${e}`);
          console.error(`###### "${hdr.full_header}"`);
        }
      }
      if (!msg.body) {
        console.error(`###### No body for: ${filepath}`);
      }
      count += 1;
    }
  } catch (err) {
    console.error(err);
  }
}

console.log(`${count} messages processed`);
