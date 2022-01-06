const crypto = require("crypto");
const fs = require('fs');
const libqp = require('libqp');
const Iconv  = require('iconv').Iconv;

import { SyntaxError, parse, structuredHeaders } from './message-parser';
import { ContentTransferEncoding, ContentType, Parameter, Encoding } from './message-types';

// Version of node-re2 that uses latin1; searching by byte value, not
// by Unicode code-points.
const RE2 = require("re2-latin1");

// Required to be present.
const required = [
  // "Date",                    // Often missing on legit messages.
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
  "Message-Id",
  "References",
  "Reply-To",
  "Sender",
  "Subject",
  "To",
  // RFC-2045
  "Content-Transfer-Encoding",
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
  // "Message-Id",              // Often incorrect.
  // "Received",                // Often incorrect.
  // "References",              // Often incorrect.
  "Reply-To",
  "Sender",
  "To",
  // RFC-2045
  "Content-Transfer-Encoding",
  "Content-Type",
  "MIME-Version",
];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unquote(quoted_string: string) {
  return quoted_string.substr(1).substr(0, quoted_string.length - 2);
}

function quote(unquoted_string: string) {
  return `"${unquoted_string}"`;
}

function unescape_qp(escaped: string) {
  return escaped.replace(/(?:\\(.))/g, "$1");
}

function escape_qp(unescaped: string) {
  return unescaped.replace(/(?:(["\\]))/g, "\\$1");
}

function canonicalize_quoted_string(unquoted: string) {
  return escape_qp(unescape_qp(unquoted));
}

function enquote(s: string) {
  if (!/[^\x00-\x20\(\)\<\>@,;:\\"/\[\]\?=]+/.test(s)) {     // if it's not a valid token
    return quote(escape_qp(s));
  }
}

function hash(s: string): string {
  return crypto
    .createHash("sha256")
    .update('6.283185307179586')
    .update(s)
    .digest('base64').substr(0, 22);
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
  decoded: string | null

  // MIME multipart deconstruction
  preamble: Buffer | null;      // [preamble CRLF]
  parts: Message[];
  epilogue: Buffer | null;      // [CRLF epilogue]

  constructor(data: Buffer, full_message: boolean) {
    if (!Buffer.isBuffer(data)) {
      throw new TypeError(`Message ctor must take a Buffer, not ${typeof data}`);
    }
    this.data = data;
    this.headers = [];
    this.hdr_idx = {};

    this.body = null;
    this.decoded = null;

    this.preamble = null;
    this.parts = [];
    this.epilogue = null;

    this.coarse_chop_();
    this.index_headers_();
    this.parse_structured_headers_();
    if (full_message)           // if we're just a MIME part, skip header checks
      this.sanity_check_headers_();
    this.find_parts_();
  }

  coarse_chop_() {
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
    var next_match = 0; // offset where we expect to find the next match
    var match;
    while (match = message_re.exec(this.data)) {
      /* Check to see we haven't skipped over any bytes that did not
       * match either a header, or a body, or other.
       */
      if (message_re.lastIndex !== next_match + match[0].length) {
        const unm_len = message_re.lastIndex - (next_match + match[0].length);
        throw new Error(`unmatched at ${next_match}: "${data.slice(next_match, next_match + unm_len)}"`);
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
        // The alternative might be to ignore junk up to the next newline.
        // next_match += match.groups.body.length;
      } else {
        // We should never get a match without matching one of the groups: header, body, or other.
        const unm_len = message_re.lastIndex - (next_match + match[0].length);
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
    for (const fld of required) {
      const key = fld.toLowerCase();
      if (!this.hdr_idx[key])
        throw new Error(`missing ${fld}: header`);
    }
    for (const fld of unique) {
      const key = fld.toLowerCase();
      if (this.hdr_idx[key]?.length > 1)
        throw new Error(`too many ${fld}: headers`);
    }
    for (const fld of correct) {
      const p = this.hdr_idx[fld.toLowerCase()];
      if (p && !p.every(f => f.parsed))
        throw new Error(`syntax error in ${fld}: header`);
    }

    // Check for at least one of To:, Cc:, or Bcc.
    if (!(this.hdr_idx['to'] || this.hdr_idx['cc'] || this.hdr_idx['bcc']))
      throw new Error(`must have a recipient, one of To:, Cc:, or Bcc:`);

    // Check for Sender: if From: has more than one address.
    if (this.hdr_idx['from'][0].parsed[1].length && !this.hdr_idx['sender'])
      throw new Error(`must have Sender: if more than one address in From:`);
  }

  get_param_(name: string, parameters: Parameter[], def_val?: string) {
    var value = undefined;
    for (const param of parameters) {
      if (param[name]) {
        if (value !== undefined) {
          throw new Error(`found multiple ${name} parameters`);
        }
        value = param[name].trim();
      }
    }
    if (value === undefined) {
      if (def_val !== undefined)
        value = def_val;
      else
        throw new Error(`parameter ${name} not found`);
    }
    if (value.startsWith('"')) {
      value = canonicalize_quoted_string(unquote(value));
    }
    return value;
  }

  get_boundary_() {
    const ct = this.hdr_idx["content-type"];
    if (!(ct && ct[0] && ct[0].parsed && ct[0].parsed.type === 'multipart'))
      return null;

    if (!this.is_identity_encoding_(this.get_encoding_()))
      throw new Error('only 7bit, 8bit, or binary Content-Transfer-Encoding allowed for multipart messages');

    const boundary = this.get_param_('boundary', ct[0].parsed.parameters);

    if (!/^[ 0-9A-Za-z'\(\)+_,\-\./:=\?]+$/.test(boundary))
      throw new Error(`invalid character in multipart boundary (${boundary})`);

    if (boundary[boundary.length - 1] == ' ')
      throw new Error(`multipart boundary must not end with a space`);

    return boundary;
  }

  // <https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1>
  find_parts_() {
    if (!this.body)             // no body, no parts
      return;

    const boundary = this.get_boundary_();
    if (!boundary)
      return;

    var start_found = false;
    var end_found = false;
    var last_offset = 0;

    // prettier-ignore
    const multi_re = new RE2('^(?<start>--' + escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<encap>\r?\n--' + escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<end>\r?\n--' + escapeRegExp(boundary) + '--[ \t]*)', 'gs');
    var match;
    while (match = multi_re.exec(this.body)) {
      if (match.groups.start) {
        start_found = true;
      } else if (match.groups.encap) {
        start_found = true;
        if (last_offset === 0) {
          if (match.index !== 0) {
            this.preamble = this.body.slice(0, match.index);
          }
        } else {
          this.parts.push(new Message(this.body.slice(last_offset, match.index), false));
        }
      } else if (match.groups.end) {
        if (end_found) {
          throw new Error(`second copy of close-delimiter at offset ${match.index}`);
        }
        end_found = true;
        if (!start_found || last_offset === 0) {
          throw new Error(`close-delimiter found at offset ${match.index} before any dash-boundary`);
        }
        this.parts.push(new Message(this.body.slice(last_offset, match.index), false));
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

  get_encoding_() {
    const ce = this.hdr_idx["content-transfer-encoding"];
    if (ce && ce[0].parsed && ce[0].parsed.mechanism)
      return ce[0].parsed.mechanism;
    return '7bit';              // maybe we should be assuming 8bit now?
  }

  is_identity_encoding_(enc: Encoding): boolean {
    switch (enc) {
      case "7bit":
      case "8bit":
      case "binary":
        return true;
    }
    return false;
  }

  decode() {
    if (this.parts.length) {
      for (const part of this.parts)
        part.decode();
      return;
    }

    if (!this.body)
      return;

    const ct = this.hdr_idx["content-type"]
      ? this.hdr_idx["content-type"][0]
      : parse('Content-Type: text/plain; charset=us-ascii');

    if (ct && ct.parsed.type !== "text")
      return;

    const charset = this.get_param_('charset', ct.parsed.parameters, 'us-ascii').toLowerCase();

    const iconv = new Iconv(charset, 'utf-8');

    // decode this.body
    const enc = this.get_encoding_();
    if (this.is_identity_encoding_(enc)) {
      this.decoded = iconv.convert(this.body).toString();
      return;
    }

    switch (enc) {
      case "quoted-printable":
        var s: string;
        try {
          s = this.body.toString('ascii');
        } catch (e) {
          throw new Error(`non-ascii text in quoted-printable part`);
        }
        this.decoded = iconv.convert(libqp.decode(s)).toString();
        break;

      case "base64":
        this.decoded = iconv.convert(this.body.toString('base64')).toString();
        break;

      default:
        throw new Error(`unknown Content-Transfer-Encoding ${enc}`);
        break;
    }
  }

  encode() {
    if (this.parts.length) {
      for (const part of this.parts)
        part.encode();
      return;
    }

    if (!this.decoded)
      return;

    const ct = this.hdr_idx["content-type"]
      ? this.hdr_idx["content-type"][0]
      : parse('Content-Type: text/plain; us-ascii');

    if (ct && ct.parsed.type !== "text")
      return;

    const charset = this.get_param_('charset', ct.parsed.parameters, 'us-ascii').toLowerCase();

    const iconv = new Iconv('utf-8', charset);

    const enc = this.get_encoding_();
    if (this.is_identity_encoding_(enc)) {
      this.body = iconv.convert(this.decoded);
      return;
    }

    switch (enc) {
      case "quoted-printable":
        this.body = Buffer.from(`${libqp.wrap(libqp.encode(iconv.convert(this.decoded)))}\r\n`);
        break;

      case "base64":
        this.body = Buffer.from(iconv.convert(this.decoded).toString('base64').replace(/(.{1,76})/g, "$1\r\n"));
        break;

      default:
        throw new Error(`unknown Content-Transfer-Encoding ${enc}`);
        break;
    }
  }

  change_boundary() {
    const ct = this.hdr_idx["content-type"];
    if (!(ct && ct[0] && ct[0].parsed && ct[0].parsed.type === 'multipart'))
      return;
    for (const param of ct[0].parsed.parameters)
      if (param.boundary)
        param.boundary = `"${hash(param.boundary)}"`; // quoted as base64 can contain the tspecial "/"
  }

  writeSync(fd: number) {
    for (const hdr of this.headers) {
      if (hdr.parsed instanceof ContentType) {
        fs.writeSync(fd, `Content-Type: ${hdr.parsed.type}/${hdr.parsed.subtype}`);
        for (const param of hdr.parsed.parameters) {
          for (const [k, v] of Object.entries(param)) {
            fs.writeSync(fd, `;\r\n\t${k}=${v}`);
          }
        }
      } else if (hdr.parsed instanceof ContentTransferEncoding) {
        fs.writeSync(fd, `Content-Transfer-Encoding: ${hdr.parsed.mechanism}`);
      } else {
        fs.writeSync(fd, `${hdr.name}: ${hdr.value}`);
      }
      fs.writeSync(fd, `\r\n`);
    }
    if (this.parts.length) {
      const boundary = this.get_boundary_();
      if (!boundary) {
        throw new Error(`multiple parts without a boundary`);
      }
      for (const part of this.parts) {
        fs.writeSync(fd, `\r\n--${boundary}\r\n`);
        part.writeSync(fd);
      }
      fs.writeSync(fd, `--${boundary}--\r\n`);
    } else if (this.body) {
      fs.writeSync(fd, this.body);
    }
  }
}
