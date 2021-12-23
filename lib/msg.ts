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
      console.log(`${filepath}`);
      const data = fs.readFileSync(filepath);
      const msg = new Message(data);
      for (const hdr of msg.headers) {
        const name = hdr.name.toString().toLowerCase();
        if (name === 'to' || name === 'from' || name === 'subject') {
          console.log(`${hdr.name.toString()}: ${hdr.value.toString()}`);
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
