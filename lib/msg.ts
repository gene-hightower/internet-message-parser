"use strict";

// const punycode = require('punycode');
const nearley = require("nearley");

import { default as myGrammar } from "./grammar";
myGrammar.ParserStart = "fields";
const grammar = nearley.Grammar.fromCompiled(myGrammar);

const fs = require('fs');
const path = require('path');

import { Message, unfold } from "./Message";

const dir = '/home/gene/duckduckgo-Maildir/Inbox/cur';

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
        if (hdr.name.startsWith("X") || hdr.name.startsWith("x")) {
          continue;             // skip X- fields
        }
        const unfolded = unfold(hdr.full_header);
        try {
          const parser = new nearley.Parser(grammar);
          console.log(`feed (${unfolded})`);
          parser.feed(unfolded);
          if (parser.results.length !== 1) {
            console.error(`###### address parsing failed: ambiguous grammar`);
            console.error(`###### unfolded === "${unfolded}"`);
          }
          for (const result of parser.results) {
            console.log(`result ${result}`);
          }
        } catch (e) {
          console.error(`###### address parsing failed: ${e}`);
          console.error(`###### unfolded === "${unfolded}"`);
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
