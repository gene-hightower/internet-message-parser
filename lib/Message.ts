import { SyntaxError, parse, structuredHeaders } from './message-parser';
import { ContentType } from './message-types';

const _ = require('lodash');

// Version of node-re2 that uses latin1; searching by byte value, not
// by Unicode code-points.
const RE2 = require("re2-latin1");

// Required to be present.
const required = [
  "From",                       // RFC-{8,28,53}22
];

// Required to be unique.
const unique = [
  // RFC-{8,28,53}22
  "Bcc",
  "Cc",
  "Date",
  "From",
  "In-Reply-To",
  "References",
  "Reply-To",
  "Sender",
  "Subject",
  "To",
  // RFC-2045
  "Content-Type",
  "MIME-Version",
];

// If present, required to be syntactically correct.
const correct = [
  // RFC-{8,28,53}22
  "Bcc",
  "Cc",
  "Date",
  "From",
  "In-Reply-To",
  "Reply-To",
  "Sender",
  "To",
  // RFC-2045
  "Content-Type",
  "MIME-Version",
];

function unquote(quoted_string: string) {
  return quoted_string.substr(1).substr(0, quoted_string.length - 2);
}

function quote(unquoted_string: string) {
  return `"${unquoted_string}"`;
}

function unescape(escaped: string) {
  return escaped.replace(/(?:\\(.))/g, "$1");
}

function escape(unescaped: string) {
  return unescaped.replace(/(?:(["\\]))/g, "\\$1");
}

function canonicalize_string(unquoted: string) {
  return escape(unescape(unquoted));
}

function enquote(s: string) {
  if (!/[^\x00-\x20\(\)\<\>@,;:\\"/\[\]\?=]+/.test(s)) {     // if it's not a valid token
    return quote(escape(s));
  }
}

export function is_structured_header(name: string)  {
  return structuredHeaders.includes(name.toLowerCase());
}

export interface Field {
  name: string;
  value: string;
  full_header: string;
  parsed: any | null;
}

export interface FieldIdx  {
  [name: string]: Field[]
}

export class Message {
  data: Buffer;
  headers: Field[];
  hdr_idx: FieldIdx;

  body: Buffer | null;

  // MIME multipart deconstruction
  preamble: Buffer | null;      // [preamble CRLF]
  parts: Message[];
  epilogue: Buffer | null;      // [CRLF epilogue]

  constructor(data: Buffer) {
    this.data = data;
    this.headers = [];
    this.hdr_idx = {};

    this.body = null;

    this.preamble = null;
    this.parts = [];
    this.epilogue = null;

    this.coarse_chop_();
    this.index_headers_();
    this.parse_structured_headers_();
    this.sanity_check_headers_();
    this.find_parts_();
  }

  coarse_chop_() {
    var next_match = 0;         // offset where we expect to find the next match

    // This regex is based on RFC-822 “simple field parsing”
    // specifically section “B.1. SYNTAX” but extended to accept byte
    // values in the range 128 to 255 to support UTF-8 encoding in the
    // bodies of header fields as specified by RFC-6531.

    // See <https://datatracker.ietf.org/doc/html/rfc822#appendix-B.1>

    // This regex will accept RFC-5322 “Obsolete Syntax.”

    // prettier-ignore
    const message_re = new RE2('(?<header>' +
                                 '(?<field_name>[^\\x00-\\x20\\x80-\\xFF\\:]+)' +
                                   '(?:(?:\\r?\\n)?(?:\\x20|\\x09))*' +
                                   '\\:' +
                                 '(?<field_body>' +
                                   '(?:(?:(?:\\r?\\n)?(?:\\x20|\\x09))*[\\x00-\\xFF]*?)*(?:\\r?\\n))' +
                               ')|' +
                               '(?<body>\\r?\\n[\\x00-\\xFF]*$)|' +
                               '(?<other>[^\\r\\n]+)', 'gs');
    var match;
    while (match = message_re.exec(this.data)) {
      const match_length = match[0].length;

      /* Check to see we haven't skipped over any bytes that did not
       * match either a header or a body.
       */
      if (message_re.lastIndex !== next_match + match_length) {
        const unm_len = message_re.lastIndex - (next_match + match_length);
        throw new Error(`Unmatched at ${next_match}: "${data.slice(next_match, next_match + unm_len)}"`);
      }

      if (match.groups.header) {
        this.headers.push({
          name: match.groups.field_name.toString(),
          value: match.groups.field_body.toString().trim(),
          full_header: match.groups.header.toString(),
          parsed: null,
        });
        next_match += match.groups.header.length;
      } else if (match.groups.body) {
        this.body = match.groups.body;
        next_match += match.groups.body.length;
      } else if (match.groups.other) {
        throw new Error(`unknown string at ${next_match}: "${match.groups.other}"`);
        // Or maybe we might choose to ignore junk up to the next newline?
        // next_match += match.groups.body.length;
        // ...
      } else {
        const unm_len = message_re.lastIndex - (next_match + match_length);
        throw new Error(`unknown match at ${next_match}: "${data.slice(next_match, next_match + unm_len)}"`);
      }
    }
  }

  index_headers_() {
    for (const hdr of this.headers) {
      const key = hdr.name.toLowerCase();
      this.hdr_idx[key] = [...(this.hdr_idx[key] || []), hdr];
    }
  }

  parse_structured_headers_() {
    // Parse the structured headers.
    for (const hdr of this.headers) {
      if (is_structured_header(hdr.name)) {
        try {
          hdr.parsed = parse(hdr.full_header);
        } catch (ex) {
          hdr.parsed = null;    // Not all structured headers are
                                // required, so let's not throw.
        }
      }
    }
  }

  sanity_check_headers_() {
    for (const fld in required) {
      if (this.hdr_idx[fld.toLowerCase()]) {
        throw new Error(`missing ${fld}: header`);
      }
    }
    for (const fld in unique) {
      if (this.hdr_idx[fld.toLowerCase()]?.length > 1) {
        throw new Error(`too many ${fld}: headers`);
      }
    }
    for (const fld in correct) {
      const p = this.hdr_idx[fld.toLowerCase()];
      if (p && !p.every(f => f.parsed)) {
        throw new Error(`syntax error in ${fld}: header`);
      }
    }
    // Could check for at least one of To:, Cc:, or Bcc.
    // Could check for Sender: if From: has more than one address.
  }

  // <https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1>
  find_parts_() {
    if (!this.body)             // no body, no parts
      return;

    const ct = this.hdr_idx["content-type"];
    if (!ct || ct[0].parsed?.type !== 'multipart')
      return;

    var boundary = '';
    for (const param of ct[0].parsed.parameters) {
      if (param.boundary) {
        if (boundary !== '') {
          throw new Error(`Content-Type: with multiple boundary parameters`);
        }
        boundary = param.boundary.trim();
      }
    }
    if (boundary.startsWith('"')) {
      boundary = canonicalize_string(unquote(boundary));
    }
    if (boundary === '') {
      throw new Error(`Content-Type: multipart with no boundary`);
    }
    if (!/^[ 0-9A-Za-z'\(\)+_,\-\./:=\?]+$/.test(boundary)) {
      throw new Error(`invalid character in multipart boundary (${boundary})`);
    }
    if (boundary[boundary.length - 1] == ' ') {
      throw new Error(`multipart boundary must not end with a space`);
    }

    var start_found = false;
    var end_found = false;
    var last_offset = 0;

    // prettier-ignore
    const multi_re = new RE2('^(?<start>--' + _.escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<enc>\r?\n--' + _.escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<end>\r?\n--' + _.escapeRegExp(boundary) + '--[ \t]*)', 'gs');
    var match;
    while (match = multi_re.exec(this.body)) {
      if (match.groups.start) {
        start_found = true;
      } else if (match.groups.enc) {
        start_found = true;
        if (last_offset === 0) {
          if (match.index !== 0) {
            this.preamble = this.body.slice(0, match.index);
          }
        } else {
          this.parts.push(new Message(this.body.slice(last_offset, match.index)));
        }
      } else if (match.groups.end) {
        if (end_found) {
          throw new Error(`second copy of close-delimiter at offset ${match.index}`);
        }
        end_found = true;
        if (!start_found || last_offset === 0) {
          throw new Error(`close-delimiter found at offset ${match.index} before any dash-boundary`);
        }
        this.parts.push(new Message(this.body.slice(last_offset, match.index)));
      }
      last_offset = multi_re.lastIndex;
    }

    if (last_offset != this.body.length) {
      this.epilogue = this.body.slice(last_offset);
    }
    if (!start_found) {
      throw new Error(`no dash-boundary (${boundary}) found`);
    }
    if (!end_found) {
      throw new Error(`no close-delimiter (${boundary}) found`);
    }
  }
}
