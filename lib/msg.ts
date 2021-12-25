"use strict";

// const punycode = require('punycode');
const nearley = require("nearley");

import { default as myGrammar } from "./grammar";
myGrammar.ParserStart = "structured";
const grammar = nearley.Grammar.fromCompiled(myGrammar);

const fs = require('fs');
const path = require('path');

import { Message, unfold } from "./Message";

const dir = '/home/gene/duckduckgo-Maildir/Inbox/cur';

const content_type = "content-type";

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
      if (msg.hdr_idx[content_type]) {
        for (const rcv of msg.hdr_idx[content_type]) {
          console.log(`Content-Type: ${rcv.value}`);
          const parser = new nearley.Parser(grammar);
          parser.feed(`Content-Type: ${unfold(rcv.value)}`);
          if (parser.results.length !== 1) {
            console.error("###### address parsing failed: ambiguous grammar");
          }
          for (const result of parser.results) {
            console.log(result);
          }
        }
      } else {
        console.log(`no Received: header`);
      }
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
