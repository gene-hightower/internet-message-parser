const RE2 = require("re2-latin1");

//import dedent from "ts-dedent";



const data =
`Foo: bar
Received: by smtp37.relay.iad1a.emailsrvr.com (Authenticated sender:
	kiessling-AT-isoc.org) with ESMTPSA id DE4423B035B
	for <isoc-newsletter@elists.isoc.org>;
	Wed, 15 Aug 2012 14:00:03 -0400 (EDT)
From: 
 Gene Q. (a comment) Public
 <gene@digilicious.com>
To: "almost anybody"@example.com
Subject: This is a subject line
	 with more subject
Date: 26 Aug 76 1429 EDT

Message body. Message body. Message body...
one
two
...more body...
⚾
...more body...
end of body.
`.replace(/\n/g, "\r\n");

//const re_quoted_string = new RE2(/(?<qs>"(?:[^"\\\r\n]|(?:\\.))*")/s);

//const re_lws = new RE2(/(?<lws>(?:(?:\r\n)?(?:\x20|\x09))+)/s);

/*
const re = new RE2(/^(?<field_name>[^\x00-\x20\:]+)(?:[ \t])*\:(?<field_body>(?:.*?(?:\r\n[ \t].*?)*)(?:\r\n))/s);
const buf = Buffer.from(data, "utf-8");
const match = re.exec(buf)
*/

// prettier-ignore
const re = new RE2('(?<header>' +
                     '(?<field_name>[^\\x00-\\x20\\:]+)' +
                       '(?:(?:\\r?\\n)?(?:\\x20|\\x09))*' +
                       '\\:' +
                     '(?<field_body>' +
                       '(?:(?:(?:\\r?\\n)?(?:\\x20|\\x09))*[\\x00-\\xFF]*?)*(?:\\r?\\n))' +
                   ')' +
                   '|(?<body>\\r?\\n[\\x00-\\xFF]*$)', 'gs');

var reconstituted = "";

let match;
var bytes = 0;

const buf = Buffer.from(data, "utf-8");

console.log(`searching from re.lastIndex === ${re.lastIndex}`);

while ((match = re.exec(buf)) !== null) {

//while ((match = re.exec(data)) !== null) {

  var ex = false;

  const length = match[0].length;
  if (re.lastIndex !== bytes + length) {
    console.error(`#### re.lastIndex === ${re.lastIndex}`);
    console.error(`####        bytes === ${bytes}`);
    console.error(`####       length === ${length}`);
    // Throw?
    ex = true;
  }

  if (match) {
    console.log(match);
    console.log(`match.index === ${match.index}`);
    console.log(`match[0]    === «${match[0].toString()}»`);
  }

  if (match.groups?.header) {
    // console.log(`header ====================`);
    console.log(`header «${match.groups.header.toString()}»`);
    // console.log(`header length ${match[0].length}`);
    reconstituted = reconstituted + match.groups.header.toString();
    //console.log(`«${match.groups.field_name}»: «${match.groups.field_body.toString().trim()}»`);
    bytes += match.groups.header.length;
  }
  if (match.groups?.body) {
    //console.log(`body ====================`);
    reconstituted = reconstituted + match.groups.body.toString();
    console.log(`body “${match.groups.body.toString()}”`);
    bytes += match.groups.body.length;
  }

  if (ex) process.exit(0); // XXXX

  console.log(`searching from re.lastIndex === ${re.lastIndex}`);
}

if (data !== reconstituted) {
  console.log(`data !== reconstituted`);
  console.log(`--------------------`);
  console.log(`data == "${data}"`);
  console.log(`--------------------`);
  console.log(`reconstituted == "${reconstituted}"`);
}
