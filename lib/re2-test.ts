const RE2 = require("re2-latin1");

import dedent from "ts-dedent";

const data = dedent`
From: 
 Gene Q. (a comment) Public
 <gene@digilicious.com>
To: "almost anybody"@example.com
Subject: This is a subject line
	 with more subject
Date: 26 Aug 76 1429 EDT

Message body. Message body. Message body...
one
⚾
two
...more body...
...more body...
...more body...
end of body.
`.replace(/\n/g, "\r\n");

//const re_quoted_string = new RE2(/(?<qs>"(:?[^"\\\r\n]|(?:\\.))*")/s);

//const re_lws = new RE2(/(?<lws>(?:(?:\r\n)?(?:\x20|\x09))+)/s);

/*
const re = new RE2(/^(?<field_name>[^\x00-\x20\:]+)(:?[ \t])*\:(?<field_body>(:?.*?(:?\r\n[ \t].*?)*)(:?\r\n))/s);
const buf = Buffer.from(data, "utf-8");
const match = re.exec(buf)
*/

// prettier-ignore
const re = new RE2('(?<header>' +
                     '(?<field_name>[^\\x00-\\x20\\:]+)' +
                       '(?:(?:\\r?\\n)?(?:\\x20|\\x09))*' +
                       '\\:' +
                     '(?<field_body>' +
                       '(?:(?:(?:\\r?\\n)?(?:\\x20|\\x09))*[\\x00-\\xFF]*?)*(:?\\r?\\n))' +
                   ')' +
                   '|(?<body>\\r?\\n[\\x00-\\xFF]*$)', 'gs');

var reconstituted = "";

let match;
while ((match = re.exec(Buffer.from(data, "utf-8"))) !== null) {
  console.log(match);

  if (match.groups?.header) {
    console.log(`header «${match[0].toString()}»`);
    reconstituted = reconstituted + match.groups.header.toString();
    console.log(
      `«${match.groups.field_name}»: «${match.groups.field_body.toString().trim()}»`
    );
  }
  if (match.groups?.body) {
    reconstituted = reconstituted + match.groups.body.toString();
    console.log(`${match.groups.body}`);
  }
}

if (data !== reconstituted) {
  console.log(`data !== reconstituted`);
  console.log(`--------------------`);
  console.log(`data == "${data}"`);
  console.log(`--------------------`);
  console.log(`reconstituted == "${reconstituted}"`);
}
