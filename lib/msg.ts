"use strict";

const message = require('../../lib/message');

const fs = require('fs');
const path = require('path');

import { Message } from "./Message";

const dir = '/home/gene/Maildir/cur';

var count = 0;

for (const filename of fs.readdirSync(dir)) {

  const filepath = path.resolve(dir, filename);

  const stat = fs.statSync(filepath);
  const isFile = stat.isFile();

  try {
    if (isFile) {
      // console.log(`${filepath}`);
      const data = fs.readFileSync(filepath);
      const msg = new Message(data);

      for (const hdr of msg.headers) {
        if (hdr.name.startsWith("X") || hdr.name.startsWith("x")) {
          continue;             // skip X- fields
        }
        try {
          // const results = message.parse(hdr.full_header);
          message.parse(hdr.full_header);
          // console.log(`${results}`);
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
