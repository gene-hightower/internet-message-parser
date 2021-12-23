const RE2 = require("re2-latin1");

// prettier-ignore
const re = new RE2('(?<header>' +
                     '(?<field_name>[^\\x00-\\x20\\:]+)' +
                       '(?:(?:\\r?\\n)?(?:\\x20|\\x09))*' +
                       '\\:' +
                     '(?<field_body>' +
                       '(?:(?:(?:\\r?\\n)?(?:\\x20|\\x09))*[\\x00-\\xFF]*?)*(?:\\r?\\n))' +
                   ')' +
                   '|(?<body>\\r?\\n[\\x00-\\xFF]*$)', 'gs');

export interface Field {
  name: string;
  value: string;
  header: string;
}

export class Message {
  headers: Field[];
  body: Buffer | null;

  constructor(data: Buffer) {
    let match : any;

    this.headers = [];
    this.body = null;

    var bytes = 0;

    while ((match = re.exec(data)) !== null) {
      const length = match[0].length;

      if (re.lastIndex !== bytes + length) {
        console.error(`#### re.lastIndex === ${re.lastIndex}`);
        console.error(`####        bytes === ${bytes}`);
        console.error(`####       length === ${length}`);
        console.error(`#### unmatched input at offset ${bytes}`);
        console.error(`#### '${data.slice(bytes, re.lastIndex)}'`);
        // Throw?
        process.exit(0); // XXXX
      }

      if (match.groups.header) {
        this.headers.push({
          name: match.groups.field_name,
          value: match.groups.field_body.toString().trim(),
          header: match.groups.header,
        });
        bytes += match.groups.header.length;
      } else if (match.groups.body) {
        this.body = match.groups.body;
        bytes += match.groups.body.length;
      } else {
        console.error(`#### unknown match at ${bytes}`);
        // Throw?
        process.exit(0); // XXXX
      }
    }
  }
}
