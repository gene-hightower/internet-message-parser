const fs = require("fs");
const path = require("path");

import { Message, is_structured_header } from "./Message";

//const dir = '/home/gene/Maildir/.FB/cur';
//const dir = '/home/gene/Maildir/.Junk/cur';
const dir = "/home/gene/Maildir/cur";
//const dir = '/tmp/Maildir/cur';

var count_messages = 0;
var count_multipart = 0;

function log_msg(msg: Message) {
  const ct = msg.hdr_idx["content-type"];

  if (msg.parts.length) {
    // double check (belt and braces) type is multipart
    if (!(ct && ct[0].parsed?.type === "multipart")) {
      throw new Error(`multiple parts found in message type ${ct[0].parsed?.type}`);
    }

    console.log(`----- Multipart -----`);
    if (msg.preamble) {
      console.log(`----- preamble`);
    }
    if (msg.parts) {
      console.log(`${msg.parts.length} parts found`);

      var partno = 1;
      for (const part of msg.parts) {
        console.log(`----- part ${partno}`);
        for (const hdr of part.headers) {
          console.log(`${hdr.name}: ${hdr.value}`);
        }

        log_msg(part);

        partno += 1;
      }
    }
    if (msg.epilogue) {
      console.log(`----- epilogue`);
    }
  } else if (msg.decoded) {
    console.log(msg.decoded);
  } else {
    if (ct && ct[0] && ct[0].parsed) {
      console.log(`----- ${ct[0].parsed?.type} -----`);
    } else {
      console.log(`----- part -----`);
    }
  }
}

var msg = new Message(Buffer.from(""), false);

for (const filename of fs.readdirSync(dir)) {
  const filepath = path.resolve(dir, filename);

  const stat = fs.statSync(filepath);
  const isFile = stat.isFile();

  try {
    if (isFile) {
      const data = fs.readFileSync(filepath);

      try {
        msg = new Message(data, true);
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
          console.error(`###### file: ${filepath}`);
          console.error(`###### parse failed for: ${hdr.name}`);
        }
      }

      msg.decode();
      msg.change_boundary();
      msg.rewrite_headers();
      msg.encode();

      const ct = msg.hdr_idx["content-type"];
      if (ct && ct[0].parsed?.type === "multipart") {
        count_multipart += 1;

        const outdir = "/tmp/Maildir/cur";
        fs.mkdirSync(outdir, { recursive: true });
        const outpath = path.resolve(outdir, filename);
        const fd = fs.openSync(outpath, "w", 0o666);
        const data = msg.get_data();
        fs.writeSync(fd, data);
        fs.closeSync(fd);

        log_msg(msg);
      } else {
        if (ct && ct[0].parsed?.type) {
          console.log(`===== ${ct[0].parsed?.type} =====`);
        }
      }


      count_messages += 1;
    }
  } catch (e) {
    const ex = e as NodeJS.ErrnoException;
    console.error(`###### file: ${filepath}`);
    console.error(`${ex.message}`);
    console.error(`${ex.code}`);
    console.error(`${ex.stack}`);
  }
}

console.log(`${count_messages} messages processed`);
console.log(`${count_multipart} multipart messages`);
