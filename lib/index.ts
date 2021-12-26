'use strict';

const nearley  = require('nearley');

import { default as myGrammar } from './grammar';

export function parse(start: string, text: string) {
  myGrammar.ParserStart = start;
  const grammar = nearley.Grammar.fromCompiled(myGrammar);

  const parser = new nearley.Parser(grammar);
  parser.feed(text);

  if (parser.results.length !== 1) {
    console.error("###### ambiguous grammar");
  }
  for (const result of parser.results) {
    console.log(result);
  }
}

parse('received', 'Received: from to ; Thu, 22 Jul 2021 15:51:49 +0000');
