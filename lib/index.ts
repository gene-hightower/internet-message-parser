'use strict';

const nearley  = require('nearley');

import { default as myGrammar } from './grammar';

export function parse(start: string, text: string) {
    myGrammar.ParserStart = start;
    const grammar = nearley.Grammar.fromCompiled(myGrammar);

    const parser = new nearley.Parser(grammar);
    parser.feed(text);

    if (parser.results.length !== 1) {
        throw new Error("parsing failed: ambiguous grammar");
    }

    return parser.results[0];
}
