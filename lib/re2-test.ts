//const RE2 = require("re2");

import dedent from 'ts-dedent';

const data = dedent`
From:
 Gene Q. (a comment) Public
 <gene@digilicious.com>
To: "almost anybody"@example.com
Subject: This is a subject line
	 with more subject
Date: 26 Aug 76 1429 EDT

Message body. Message body. Message body...
...more body...
...more body...
...more body...
Message body.
`.replace(/\n/g, '\r\n');


//const re_quoted_string = new RE2(/(?<qs>"(:?[^"\\\r\n]|(?:\\.))*")/s);

//const re_lws = new RE2(/(?<lws>(?:(?:\r\n)?(?:\x20|\x09))+)/s);

/*
const re = new RE2(/^(?<field_name>[^\x00-\x20\:]+)(:?[ \t])*\:(?<field_body>(:?.*?(:?\r\n[ \t].*?)*)(:?\r\n))/s);
const buf = Buffer.from(data, "utf-8");
const match = re.exec(buf)
*/

//const re = /^(?<field_name>[^\x00-\x20\:]+)(:?[ \t])*\:(?<field_body>(:?.*?(:?\r\n[ \t].*?)*)(:?\r\n))/sg;
//const re = new RegExp('(?<field_name>[^\\x00-\\x20\\:]+)(:?[ \\t])*\\:(?<field_body>(:?.*?(:?\\r\\n[ \\t].*?)*)(:?\\r\\n))','sg');
//const re = new RE2('(?<header>(?<field_name>[^\\x00-\\x20\\:]+)(:?[ \\t])*\\:(?<field_body>(:?.*?(:?\\r\\n[ \\t].*?)*)(:?\\r\\n)))*','s');
const re = new RegExp('^(?<header>(?<field_name>[^\\x00-\\x20\\:]+)(:?[ \\t])*\\:(?<field_body>(:?.*?(:?\\r\\n[ \\t].*?)*)(:?\\r\\n)))*(:?\\r\\n)','s');

let match;
//while ((match = re.exec(Buffer.from(data, "utf-8"))) !== null) {
//while ((match = re.exec(data)) !== null) {
match = re.exec(data);
if (match) {
    console.log(`Found ${match[0]} start=${match.index} end=${re.lastIndex}.`);

    if (match.groups)
        console.log(`field_name: ${match.groups.field_name}`);

    if (match.groups)
        console.log(`field_body: ${match.groups.field_body}`);

    var i = 0;
    for (const m of match) {
        if (Buffer.isBuffer(m)) {
            console.log(`${i}: '${m.toString()}'`);
        }
        i += 1;
    }

    console.log(match);
}
