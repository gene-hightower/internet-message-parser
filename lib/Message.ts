const crypto = require("crypto");
const fs = require("fs");
const libqp = require("libqp");
const Iconv = require("iconv").Iconv;

import dedent from "ts-dedent";

import { SyntaxError, parse, structuredHeaders } from "./message-parser";
import { MIMEVersion, ContentTransferEncoding, ContentType, Parameter, Encoding } from "./message-types";

// Version of node-re2 that uses latin1; searching by byte value, not
// by Unicode code-points.
const RE2 = require("re2-latin1");

// Required to be present in full messages, but not MIME parts.
const required = [
  // "Date",                    // Often missing on legit messages.
  "From", // RFC-{8,28,53}22
];

// Required to be unique.
const unique = [
  // RFC-{8,28,53}22
  "Bcc",
  "Cc",
  "Date",
  "From",
  "In-Reply-To",
  "Message-ID",
  "References",
  "Reply-To",
  "Sender",
  "Subject",
  "To",
  // RFC-2045
  "Content-Transfer-Encoding",
  "Content-Type",
  // "MIME-Version",            // As long as they are correct.
];

// If present, required to be syntactically correct.
const correct = [
  // RFC-{8,28,53}22
  "Bcc",
  "Cc",
  "Date",
  "From",
  "In-Reply-To",
  // "Message-ID",              // Often incorrect.
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
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  if (!/[^\x00-\x20\(\)\<\>@,;:\\"/\[\]\?=]+/.test(s)) {
    // if it's not a valid token
    return quote(escape_qp(s));
  }
}

function hash(s: string): string {
  // prettier-ignore
  return crypto
    .createHash("sha256")
    .update("6.283185307179586")
    .update(s)
    .digest("base64")
    .substr(0, 22); // 22 chars times 6 bits per char is 132 bits
}

export function is_structured_header(name: string) {
  return structuredHeaders.includes(name.toLowerCase());
}

export interface Field {
  name: string;
  value: string;
  full_header: string;
  parsed: any | null;
}

function new_field(n: string, v: string): Field {
  const full = `${n}: ${v}\r\n`;
  return {
    name: n,
    value: v,
    full_header: full,
    parsed: parse(full),
  };
}

export interface FieldIdx {
  [name: string]: Field[];
}

export enum MessageType {
  full, // Top level RFC-{8,28,53}22 Internet Message
  message_digest, // <https://www.rfc-editor.org/rfc/rfc2046#section-5.1.5>
  message_rfc822, // <https://www.rfc-editor.org/rfc/rfc2046#section-5.2.1>
  part, // some other part of a multipart/mixed, or
  //  message/partial or message/external-body
}

export class Message {
  data: Buffer;
  type: MessageType;
  headers: Field[];
  hdr_idx: FieldIdx;

  body: Buffer | null;
  decoded: Buffer | string | null;

  // MIME multipart deconstruction
  preamble: Buffer | null; // [preamble CRLF] <- buffer content excludes the CRLF
  parts: Message[];
  epilogue: Buffer | null; // [CRLF epilogue] <- buffer content excludes the CRLF

  constructor(data: Buffer, type?: MessageType) {
    if (!Buffer.isBuffer(data)) {
      throw new TypeError(`Message ctor must take a Buffer, not ${typeof data}`);
    }
    this.data = data;
    this.type = type === undefined ? MessageType.full : type;
    this.headers = [];
    this.hdr_idx = {};

    this.body = null;
    this.decoded = null;

    this.preamble = null;
    this.parts = [];
    this.epilogue = null;

    this._coarse_chop();
    this._index_headers();
    this._parse_structured_headers();
    // Make this an optional step.
    // this._sanity_check_headers();
    this._find_parts();
  }

  _coarse_chop() {
    // This regex is based on RFC-822 “simple field parsing”
    // specifically section “B.1. SYNTAX” but extended to accept byte
    // values in the range 128 to 255 to support UTF-8 encoding in the
    // bodies of header fields as specified by RFC-6532.

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
                               '(\\r?\\n(?<body>[\\x00-\\xFF]*$))|' +
                               '(?<other>[^\\r\\n]+)', 'gs');
    let next_match = 0; // offset where we expect to find the next match
    let match;
    while ((match = message_re.exec(this.data))) {
      /* Check to see we haven't skipped over any bytes that did not
       * match either a header, or a body, or other.
       */
      if (message_re.lastIndex && message_re.lastIndex !== next_match + match[0].length) {
        const unm_len = message_re.lastIndex - (next_match + match[0].length);
        const s = this.data.slice(next_match, next_match + unm_len);
        throw new Error(dedent`unmatched at ${next_match}: «${s}»
                               lastIndex=${message_re.lastIndex}
                               m.len=${match[0].length}
                               match[0]=«${match[0]}»`);
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
        throw new Error(`unknown match at ${next_match}: «${match[0]}»`);
      }
    }
  }

  _index_headers() {
    for (const hdr of this.headers) {
      const key = hdr.name.toLowerCase();
      this.hdr_idx[key] = [...(this.hdr_idx[key] || []), hdr];
    }
  }

  _set_field(n: string, v: string) {
    const nf = new_field(n, v);
    const key = n.toLowerCase();
    const existing_field = this.hdr_idx[key];
    if (existing_field) {
      this.headers = this.headers.filter((f) => f.name.toLowerCase() != key);
      this.headers.push(nf);
      this.hdr_idx[key] = [nf];
    } else {
      this.headers.push(nf);
      this.hdr_idx[key] = [nf];
    }
  }

  _parse_structured_headers() {
    for (const hdr of this.headers) {
      if (is_structured_header(hdr.name)) {
        try {
          hdr.parsed = parse(hdr.full_header);
        } catch (ex) {
          // Not all structured headers are required, so ignore parse
          // failure.
          hdr.parsed = null;
        }
      }
    }
  }

  sanity_check_headers() {
    if (this.type === MessageType.full) {
      // Required fields for full messages only.
      for (const fld of required) {
        const key = fld.toLowerCase();
        if (!this.hdr_idx[key]) {
          throw new Error(`missing ${fld}: header`);
        }
      }
    }

    for (const fld of unique) {
      const key = fld.toLowerCase();
      const vals = this.hdr_idx[key];
      if (vals && vals.length > 1) {
        throw new Error(`too many ${fld}: headers`);
      }
    }
    for (const fld of correct) {
      const key = fld.toLowerCase();
      const vals = this.hdr_idx[key];
      if (vals) {
        let n = 1;
        for (const val of vals) {
          if (!val.parsed) {
            throw new Error(`syntax error in ${fld}: header #${n} (${val.full_header.trim()})`);
          }
          ++n;
        }
      }
    }

    if (this.type === MessageType.full) {
      // Check for at least one of To:, Cc:, or Bcc.
      if (!(this.hdr_idx["to"] || this.hdr_idx["cc"] || this.hdr_idx["bcc"]))
        throw new Error(`must have a recipient; at least one of To:, Cc:, or Bcc:`);

      // Check for Sender: if From: has more than one address.
      if (this.hdr_idx["from"][0].parsed[1].length && !this.hdr_idx["sender"])
        throw new Error(`must have Sender: if more than one address in From:`);
    }

    // <https://www.rfc-editor.org/rfc/rfc2046#section-5.2.1>
    /*
    if (this.type === MessageType.message_rfc822) {
      // Check for at least one of From:, Subject:, or Date:
      if (!(this.hdr_idx["from"] || this.hdr_idx["subject"] || this.hdr_idx["date"]))
        throw new Error(`at least one of "From", "Subject", or "Date" must be present`);
    }

    for (const part of this.parts) part._sanity_check_headers();
    */
  }

  _get_param(name: string, parameters: Parameter[], default_value?: string): string {
    const values = parameters.filter((p) => !!p[name]).map((v) => v[name].trim());

    if (values.length === 0 && default_value) values.push(default_value);

    const canon = values.map((v) => (v.startsWith('"') ? canonicalize_quoted_string(unquote(v)) : v));

    const uniq = [...new Set(canon)]; // remove dups

    if (uniq.length > 1) {
      throw new Error(`found multiple conflicting ${name} parameters`);
    }
    if (uniq.length === 0) {
      throw new Error(`parameter ${name} not found`);
    }

    return uniq[0];
  }

  _get_content_type() {
    const ct = this.hdr_idx["content-type"];
    if (ct && ct[0].parsed) {
      return ct[0].parsed;
    }

    switch (this.type) {
      case MessageType.full:
      case MessageType.message_rfc822:
      case MessageType.part:
        return parse("Content-Type: text/plain; charset=utf-8\r\n");

      case MessageType.message_digest:
        return parse("Content-Type: message/rfc822\r\n");

      default:
        throw new Error(`unknown message type (${this.type})`);
    }
  }

  _get_boundary(): string | null {
    const ct = this._get_content_type();

    if (ct.type !== "multipart") {
      return null;
    }

    const boundary = this._get_param("boundary", ct.parameters);

    if (!/^[ 0-9A-Za-z'\(\)+_,\-\./:=\?]+$/.test(boundary))
      throw new Error(`invalid character in multipart boundary (${boundary})`);

    if (boundary[boundary.length - 1] == " ") {
      throw new Error(`multipart boundary must not end with a space`);
    }

    return boundary;
  }

  // <https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1>
  _find_parts() {
    if (!this.body)
      // no body, no parts
      return;

    const ct = this._get_content_type();

    if (ct.type === "message") {
      if (ct.subtype === "rfc822") {
        this.parts.push(new Message(this.body, MessageType.message_rfc822));
      }
      // e.g. if (ct.subtype === "partial") there is no breaking down the body,
      // therefore not parts.
      return;
    }

    if (ct.type !== "multipart") {
      return;
    }

    const boundary = this._get_boundary();
    if (boundary === null)
      // redundant check with ct.type check above
      return;

    let boundary_found = false;
    let end_found = false;
    let last_offset = 0;

    // prettier-ignore
    const multi_re = new RE2('^(?<start>--' + escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<encap>\r?\n--' + escapeRegExp(boundary) + '[ \t]*\r?\n)|' +
                             '(?<end>\r?\n--' + escapeRegExp(boundary) + '--[ \t]*)', 'gs');
    let match;
    while ((match = multi_re.exec(this.body))) {
      if (match.groups.start) {
        boundary_found = true;
      }
      if (match.groups.encap) {
        if (!boundary_found) {
          this.preamble = this.body.slice(0, match.index);
          boundary_found = true;
        } else {
          try {
            this.parts.push(new Message(this.body.slice(last_offset, match.index), MessageType.part));
          } catch (e) {
            const ex = e as NodeJS.ErrnoException;
            throw new Error(`submessage encap part #${this.parts.length}, off ${last_offset} failed: ${ex.message}`);
          }
        }
      }
      if (match.groups.end) {
        if (end_found) {
          throw new Error(`redundant copy of close-delimiter at offset ${match.index}`);
        }
        end_found = true;
        if (!boundary_found || last_offset === 0) {
          throw new Error(`close-delimiter found at offset ${match.index} before any dash-boundary`);
        }
        try {
          this.parts.push(new Message(this.body.slice(last_offset, match.index), MessageType.part));
        } catch (e) {
          const ex = e as NodeJS.ErrnoException;
          throw new Error(`submessage end part #${this.parts.length}, off ${last_offset} failed: ${ex.message}`);
        }
      }
      if (multi_re.lastIndex) {
        last_offset = multi_re.lastIndex;
      } else {
        last_offset = match.index + match[0].length;
      }
    }

    if (last_offset != this.body.length) {
      // The epilogue excludes the CRLF found after the “close-delimiter.”
      let idx = last_offset;
      if (this.body[idx] === 13) ++idx; // skip (optional) '\r'
      if (this.body[idx] === 10) ++idx; // skip '\n'
      this.epilogue = this.body.slice(idx);
    }
    if (!boundary_found) {
      throw new Error(`no dash-boundary (--${boundary}) found`);
    }
    if (!end_found) {
      throw new Error(`no close-delimiter (--${boundary}--) found`);
    }
  }

  _get_transfer_encoding() {
    const ce = this.hdr_idx["content-transfer-encoding"];
    if (ce && ce[0].parsed && ce[0].parsed.mechanism) {
      return ce[0].parsed.mechanism;
    }
    return "8bit"; // <- the RFC suggests 7bit as default
  }

  /* Call a function “f” to transform each text type body part.
   */
  all_text_parts(f: (body: string, subtype: string) => string) {
    if (this.parts.length) {
      for (const part of this.parts) {
        part.all_text_parts(f);
      }
    } else if (typeof this.decoded === "string") {
      const ct = this._get_content_type();
      if (ct.type === "text")
        // should always be true if decoded is a string
        this.decoded = f(this.decoded, ct.subtype);
    }
  }

  /* Decode all text type body parts into a JS string “decoded.”
   */
  decode() {
    if (this.parts.length) {
      for (const part of this.parts) {
        part.decode();
      }
      return;
    }
    if (!this.body) {
      return;
    }

    let body;
    const enc = this._get_transfer_encoding();
    switch (enc) {
      case "7bit":
      case "8bit":
      case "binary":
        body = this.body;
        break;

      case "quoted-printable":
        // This is an extension, UTF-8 data in quoted-printable:
        body = libqp.decode(this.body.toString());
        break;

      case "base64":
        body = Buffer.from(this.body.toString(), "base64");
        break;

      default:
        throw new Error(`unknown Content-Transfer-Encoding ${enc}`);
    }

    const ct = this._get_content_type();

    if (ct.type !== "text") {
      this.decoded = body;
      return;
    }

    const charset = this._get_param("charset", ct.parameters, "utf-8").toLowerCase();

    const iconv = new Iconv(charset, "utf-8");

    // Convert body to “decoded” string.
    try {
      this.decoded = iconv.convert(body).toString();
      return;
    } catch (e) {
      const ex = e as NodeJS.ErrnoException;
        if (ex.code !== "EILSEQ") {
          throw ex;
        }
        // Ignore EILSEQ
    }
    if (charset.toLowerCase() !== "utf-8") {
      try {
        // Try again assuming UTF-8.
        this.decoded = body.toString();
        return;
      } catch (ee) {
          const eex = ee as NodeJS.ErrnoException;
          if (eex.code !== "EILSEQ") {
            throw eex;
          }
          // Ignore EILSEQ
        }
    }
    try {
      const iconv_8859 = new Iconv("iso-8859-1", "utf-8");
      this.decoded = iconv_8859.convert(body).toString();
      return;
    } catch (eee) {
      const eeex = eee as NodeJS.ErrnoException;
      if (eeex.code === "EILSEQ") {
        // Should never happen, since all byte sequences are legal 8859.
        eeex.message = `Illegal character sequence decoding ${enc}, charset="${charset}" or as 8859-1`;
      }
      throw eeex;
    }
  }

  /* Encode each decoded text body part into the Buffer “body” using
   * Content-Type and Content-Transfer-Encoding.
   */
  encode() {
    if (this.parts.length) {
      for (const part of this.parts) {
        part.encode();
      }
      return;
    }
    if (!this.decoded) return;

    const ct = this._get_content_type();

    let body;
    if (ct.type === "text") {
      const charset = this._get_param("charset", ct.parameters, "utf-8").toLowerCase();

      const iconv = new Iconv("utf-8", charset);

      try {
        body = iconv.convert(this.decoded);
      } catch (e) {
        const ex = e as NodeJS.ErrnoException;
        if (ex.code === "EILSEQ") {
          // Now we fall-back to Unicode, which should always work.
          const cty = this.hdr_idx["content-type"];
          if (!cty)
            // we should never get a conversion error unless Content-Type: is set
            throw ex;

          this._set_field("Content-Type", `text/${cty[0].parsed.subtype}; charset=utf-8`);
          this._set_field("Content-Transfer-Encoding", "quoted-printable");

          body = Buffer.from(this.decoded);
        } else {
          throw ex; // no idea what other type of exception this could be
        }
      }
    } else {
      if (Buffer.isBuffer(this.decoded)) {
        body = this.decoded;
      } else {
        throw new Error(`non-text decoded part (${ct.type / ct.subtype}) should be a Buffer`);
      }
    }

    const enc = this._get_transfer_encoding();
    switch (enc) {
      case "7bit":
      case "8bit":
      case "binary":
        this.body = body;
        break;

      case "quoted-printable":
        this.body = Buffer.from(`${libqp.wrap(libqp.encode(body))}\r\n`);
        break;

      case "base64":
        this.body = Buffer.from(body.toString("base64").replace(/(.{1,76})/g, "$1\r\n"));
        break;

      default:
        throw new Error(`unknown Content-Transfer-Encoding ${enc}`);
    }
  }

  change_boundary() {
    for (const part of this.parts) {
      part.change_boundary();
    }

    const ct = this._get_content_type();
    if (ct.type === "multipart") {
      for (const param of ct.parameters) {
        if (param.boundary) {
          param.boundary = `"=_${hash(param.boundary)}_="`;
        }
      }
    }
  }

  _get_hdr_sz(): number {
    let sz = 0;
    for (const hdr of this.headers) {
      // the +2s are for ": " and "\r\n"
      sz += Buffer.byteLength(hdr.name) + 2 + Buffer.byteLength(hdr.value) + 2;
    }
    return sz;
  }

  _get_data_sz(): number {
    let sz = this._get_hdr_sz();
    if (this.parts.length) {
      const boundary = this._get_boundary();
      if (!boundary) {
        return sz + 2 + this.parts[0]._get_data_sz(); // "\r\n" + parts[0]
      }
      for (const part of this.parts) {
        sz += `\r\n--${boundary}\r\n`.length + part._get_data_sz();
      }
      sz += `\r\n--${boundary}--`.length;
    } else if (this.body) {
      sz += `\r\n`.length + this.body.length;
    }
    return sz;
  }

  get_data(): Buffer {
    let sz = this._get_data_sz();
    let buf = Buffer.alloc(sz);
    let p = 0;

    for (const hdr of this.headers) {
      p += buf.write(`${hdr.name}: ${hdr.value}\r\n`, p, "utf-8");
    }
    if (p !== this._get_hdr_sz()) throw new Error(`programmar fail: header size`);

    if (this.parts.length) {
      const boundary = this._get_boundary();
      if (!boundary) {
        p += Buffer.from(`\r\n`).copy(buf, p);
        p += this.parts[0].get_data().copy(buf, p);
        if (p !== sz) throw new Error(`programmar fail: size`);
        return buf;
      }
      for (const part of this.parts) {
        p += Buffer.from(`\r\n--${boundary}\r\n`).copy(buf, p);
        p += part.get_data().copy(buf, p);
      }
      p += Buffer.from(`\r\n--${boundary}--`).copy(buf, p);
    } else if (this.body) {
      p += Buffer.from(`\r\n`).copy(buf, p);
      p += this.body.copy(buf, p);
    }
    if (p !== sz) throw new Error(`programmar fail: body size`);

    return buf;
  }

  /* The initial way I wrote the above get_data(), now I'm not too sure I shouldn't just leave it this way.
   */
  _get_data_slow(): Buffer {
    // Inefficient Buffer copies? Much nicer code.
    let buf = Buffer.alloc(0);

    for (const hdr of this.headers) {
      buf = Buffer.concat([buf, Buffer.from(`${hdr.name}: ${hdr.value}\r\n`)]);
    }

    if (this.parts.length) {
      const boundary = this._get_boundary();
      if (!boundary) {
        return Buffer.concat([buf, Buffer.from(`\r\n`), this.parts[0].get_data()]);
      }
      for (const part of this.parts) {
        buf = Buffer.concat([buf, Buffer.from(`\r\n--${boundary}\r\n`), part.get_data()]);
      }
      buf = Buffer.concat([buf, Buffer.from(`\r\n--${boundary}--`)]);
    } else if (this.body) {
      buf = Buffer.concat([buf, Buffer.from(`\r\n`), this.body]);
    }

    return buf;
  }

  /* Regenerate canonical textual name and value of parsed headers.
   * This rewrites just the MIME headers:
   * MIME-Version, Content-Type, and Content-Transfer-Encoding.
   */
  rewrite_headers() {
    for (const part of this.parts) {
      part.rewrite_headers();
    }

    for (const hdr of this.headers) {
      if (hdr.parsed instanceof ContentType) {
        let nv = `${hdr.parsed.type}/${hdr.parsed.subtype}`;
        for (const param of hdr.parsed.parameters) {
          for (const [k, v] of Object.entries(param)) {
            nv += `;\r\n\t${k}=${v}`;
          }
        }
        hdr.name = "Content-Type";
        hdr.value = nv;
      } else if (hdr.parsed instanceof ContentTransferEncoding) {
        hdr.name = "Content-Transfer-Encoding";
        hdr.value = `${hdr.parsed.mechanism}`;
      } else if (hdr.parsed instanceof MIMEVersion) {
        hdr.name = "MIME-Version";
        hdr.value = "1.0";
      }
    }
  }
}
