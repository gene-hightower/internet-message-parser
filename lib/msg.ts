import { SyntaxError, parse } from './message-parser';
import { ContentType } from './message-types';

const fs = require('fs');
const path = require('path');

import { Message } from "./Message";

//const dir = '/home/gene/Maildir/.Junk/cur';
//const dir = '/home/gene/Maildir/cur';
const dir = '/tmp/Maildir/cur';

const bcc = "bcc";
const cc = "cc";
const content_transfer_encoding = "content-transfer-encoding";
const content_type = "content-type";
const date = "date";
const from = "from";
const in_reply_to = "in-reply-to";
const message_id = "message-id";
const mime_version = "mime-version";
const references = "references";
const reply_to = "reply-to";
const sender = "sender";
const subject = "subject";
const to = "to";

const structured_headers = [
  "accept-language",
  "authentication-results",
  "auto-submitted",
  bcc,
  cc,
  "content-disposition",
  "content-id",
  "content-language",
  "content-location",
  content_transfer_encoding,
  content_type,
  date,
  from,
  in_reply_to,
  "keywords",
  message_id,
  mime_version,
  "received",
  references,
  reply_to,
  "require-recipient-valid-since",
  "resent-bcc",
  "resent-cc",
  "resent-date",
  "resent-from",
  "resent-message-id",
  "resent-sender",
  "resent-to",
  "return-path",
  sender,
  to,
];

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

function is_ascii(charset: string): boolean {
  // <https://www.iana.org/assignments/character-sets/character-sets.xhtml>
  const ascii_aliases = [
    "ansi_x3.4-1968",
    "ansi_x3.4-1986",
    "ascii",                    // <- This is an addition to the standard.
    "cp367",
    "csascii",
    "ibm367",
    "iso-ir-6",
    "iso646-us",
    "iso_646.irv:1991",
    "us",
    "us-ascii",
  ];
  return ascii_aliases.includes(charset.toLowerCase());
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
      } catch (ex) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### Message() failed: ${ex}`);
      }

      if (!msg.body) {
        console.error(`###### No body for: ${filepath}`);
        continue;
      }

      for (const hdr of msg.headers) {
        if (structured_headers.includes(hdr.name.toLowerCase())) {
          try {
            hdr.parsed = parse(hdr.full_header);
            if (!hdr.parsed) {
              console.error(`###### file: ${filepath}`);
              console.error(`###### message.parse failed`);
              console.error(hdr.full_header);
            }
            if (hdr.parsed[0] && hdr.parsed[0][0] && typeof hdr.parsed[0][0] !== 'string') {
              console.error(`###### file: ${filepath}`);
              console.error(`###### parse failed for: ${flat_string(hdr.parsed[0][0])}`);
              console.error(hdr.parsed);
            }
          } catch (ex) {
            console.error(`###### file: ${filepath}`);
            console.error(`###### message.parse exception: ${ex}`);
            console.error(hdr.full_header);
          }
        }
      }

      // Validate the message a bit.
      if (!msg.hdr_idx[from]) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### missing From: header`);
        continue;
      }
      if (msg.hdr_idx[from].length > 1) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### too many From: headers`);
        continue;
      }
      if (!msg.hdr_idx[from][0].parsed) {
        console.error(`###### bogus From: header`);
        continue;
      }

      if (!msg.hdr_idx[subject]) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### missing Subject: header`);
        // continue; // not fatal, I guess
      }
      if (msg.hdr_idx[subject] && msg.hdr_idx[subject].length > 1) {
        console.error(`###### file: ${filepath}`);
        console.error(`###### too many Subject: headers`);
        continue;
      }

      // etc. check for sender if more than one address listed in From:
      // check for a To: or a Cc: or a Bcc:

      const ct = msg.hdr_idx[content_type];
      const mv = msg.hdr_idx[mime_version];

      if (ct) {
        if (ct.length > 1) {
          console.error(`###### file: ${filepath}`);
          console.error(`###### too many Content-Type: headers`);
          continue;
        }
        if (ct[0] && !(ct[0].parsed && ct[0].parsed instanceof ContentType)) {
          console.error(`###### file: ${filepath}`);
          console.error(`###### Content-Type: invalid syntax`);
          continue;
        }

        console.log(`###### ct === ${JSON.stringify(ct[0])}`);

        if (!mv || !mv[0] || !mv[0].parsed) {
          // If no MIME-version, Content-Type must be text/plain
          if (ct[0].parsed.type !== 'text' || ct[0].parsed.subtype !== 'plain') {
            console.error(`###### file: ${filepath}`);
            console.error(`###### without MIME-Version, Content-Type: must be text/plain`);
            continue;
          }
          // And charset must be US-ASCII.
          for (const param of ct[0].parsed.parameters) {
            if (param.charset && !is_ascii(param.charset)) {
              console.error(`###### file: ${filepath}`);
              console.error(`###### without MIME-Version, Content-Type: charset must be US-ASCII`);
              continue;
            }
          }
          // If we pass the above two tests, we're okay.
          // console.error(`###### file: ${filepath}`);
          // console.error(`###### Content-Type: with no MIME-Version:`);
          // continue;
        }

        // const cte = msg.hdr_idx[content_transfer_encoding];

        if (ct[0].parsed.type === 'multipart') {
          var boundary = '';
          for (const param of ct[0].parsed.parameters) {
            if (param.boundary) {
              if (boundary !== '') {
                console.error(`###### file: ${filepath}`);
                console.error(`###### Content-Type: with multiple boundary parameters`);
                continue;
              }
              boundary = param.boundary;
            }
          }
          if (boundary === '') {
            console.error(`###### file: ${filepath}`);
            console.error(`###### Content-Type: multipart with no boundary`);
            continue;
          }

          if (!msg.find_parts(boundary)) {
            console.error(`###### file: ${filepath}`);
            console.error(`###### find_parts(${boundary}) failed`);
          }
        }
      }

      count += 1;
    }
  } catch (ex) {
    console.error(ex);
  }
}

console.log(`${count} messages processed`);
