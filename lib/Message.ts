const crypto = require("crypto");
const fs = require("fs");
const libqp = require("libqp");
const Iconv = require("iconv").Iconv;

import { SyntaxError, parse, structuredHeaders } from "./message-parser";
import { MIMEVersion, ContentTransferEncoding, ContentType, Parameter, Encoding } from "./message-types";

// Version of node-re2 that uses latin1; searching by byte value, not
// by Unicode code-points.
const RE2 = require("re2-latin1");

const default_ct_value = `text/plain; charset=utf-8`;
const default_content_type = `Content-Type: ${default_ct_value}\r\n`;

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
    .substr(0, 22);
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

export interface FieldIdx {
  [name: string]: Field[];
}

export class Message {
  data: Buffer;
  headers: Field[];
  hdr_idx: FieldIdx;

  body: Buffer | null;
  decoded: Buffer | string | null;

  // MIME multipart deconstruction
  preamble: Buffer | null; // [preamble CRLF] <- buffer content excludes the CRLF
  parts: Message[];
  epilogue: Buffer | null; // [CRLF epilogue] <- buffer content excludes the CRLF

  constructor(data: Buffer, full_message?: boolean) {
    if (!Buffer.isBuffer(data)) {
      throw new TypeError(`Message ctor must take a Buffer, not ${typeof data}`);
    }
    if (full_message === undefined) full_message = true;
    this.data = data;
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
    this._sanity_check_headers(full_message);
    this._find_parts();
  }

  _coarse_chop() {
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
                               '(\\r?\\n(?<body>[\\x00-\\xFF]*$))|' +
                               '(?<other>[^\\r\\n]+)', 'gs');
    let next_match = 0; // offset where we expect to find the next match
    let match;
    while ((match = message_re.exec(this.data))) {
      /* Check to see we haven't skipped over any bytes that did not
       * match either a header, or a body, or other.
       */
      if (message_re.lastIndex !== next_match + match[0].length) {
        const unm_len = message_re.lastIndex - (next_match + match[0].length);
        throw new Error(`unmatched at ${next_match}: "${this.data.slice(next_match, next_match + unm_len)}"`);
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
        throw new Error(`unknown match at ${next_match}: "${this.data.slice(next_match, next_match + unm_len)}"`);
      }
    }
  }

  _index_headers() {
    for (const hdr of this.headers) {
      const key = hdr.name.toLowerCase();
      this.hdr_idx[key] = [...(this.hdr_idx[key] || []), hdr];
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

  _sanity_check_headers(full_message: boolean) {
    if (full_message) {
      // Required fields for full messages only.
      for (const fld of required) {
        const key = fld.toLowerCase();
        if (!this.hdr_idx[key]) throw new Error(`missing ${fld}: header`);
      }
    }
    for (const fld of unique) {
      const key = fld.toLowerCase();
      if (this.hdr_idx[key]?.length > 1) throw new Error(`too many ${fld}: headers`);
    }
    for (const fld of correct) {
      const p = this.hdr_idx[fld.toLowerCase()];
      if (p && !p.every((f) => f.parsed)) throw new Error(`syntax error in ${fld}: header`);
    }
    if (full_message) {
      // Check for at least one of To:, Cc:, or Bcc.
      if (!(this.hdr_idx["to"] || this.hdr_idx["cc"] || this.hdr_idx["bcc"]))
        throw new Error(`must have a recipient, one of To:, Cc:, or Bcc:`);

      // Check for Sender: if From: has more than one address.
      if (this.hdr_idx["from"][0].parsed[1].length && !this.hdr_idx["sender"])
        throw new Error(`must have Sender: if more than one address in From:`);
    }
  }

  _get_param(name: string, parameters: Parameter[], default_value?: string) {
    const values = parameters.filter((p) => !!p[name]).map((v) => v[name].trim());

    if (values.length === 0 && default_value) values.push(default_value);

    const canon = values.map((v) => (v.startsWith('"') ? canonicalize_quoted_string(unquote(v)) : v));

    const uniq = [...new Set(canon)]; // remove dups

    if (uniq.length > 1) throw new Error(`found multiple conflicting ${name} parameters`);
    if (uniq.length === 0) throw new Error(`parameter ${name} not found`);

    return uniq[0];
  }

  _get_boundary() {
    const ct = this.hdr_idx["content-type"];
    if (!(ct && ct[0] && ct[0].parsed.type === "multipart")) return null;

    /*
      In my mailbox I find:

      Content-Type: multipart/signed;
	boundary="Apple-Mail=_9A03B61D-50E6-4D41-B64E-473BCFD5D818";
	protocol="application/pkcs7-signature";
	micalg=sha-256
      Content-Transfer-Encoding: quoted-printable

      So, let's just ignore the Content-Transfer-Encoding for multipart types.

    if (!this._is_identity_encoding(this._get_encoding()))
      throw new Error('only 7bit, 8bit, or binary Content-Transfer-Encoding allowed for multipart messages');
    */

    const boundary = this._get_param("boundary", ct[0].parsed.parameters);

    if (!/^[ 0-9A-Za-z'\(\)+_,\-\./:=\?]+$/.test(boundary))
      throw new Error(`invalid character in multipart boundary (${boundary})`);

    if (boundary[boundary.length - 1] == " ") throw new Error(`multipart boundary must not end with a space`);

    return boundary;
  }

  // <https://www.rfc-editor.org/rfc/rfc2046#section-5.1.1>
  _find_parts() {
    if (!this.body)
      // no body, no parts
      return;

    const boundary = this._get_boundary();
    if (!boundary) return;

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
      } else if (match.groups.encap) {
        if (!boundary_found) {
          // Strip off the CRLF before the “dash-boundary.”
          let idx = match.index;
          if (this.body[idx] === 13) ++idx; // skip (optional) '\r'
          ++idx; // skip '\n'
          this.preamble = this.body.slice(0, idx);
          boundary_found = true;
        } else {
          this.parts.push(new Message(this.body.slice(last_offset, match.index), false));
        }
      } else if (match.groups.end) {
        if (end_found) {
          throw new Error(`redundant copy of close-delimiter at offset ${match.index}`);
        }
        end_found = true;
        if (!boundary_found || last_offset === 0) {
          throw new Error(`close-delimiter found at offset ${match.index} before any dash-boundary`);
        }
        this.parts.push(new Message(this.body.slice(last_offset, match.index), false));
      }
      last_offset = multi_re.lastIndex;
    }

    if (last_offset != this.body.length) {
      // The epilogue excludes the CRLF found after the “close-delimiter.”
      let idx = last_offset;
      if (this.body[idx] === 13) ++idx; // skip (optional) '\r'
      ++idx; // skip '\n'
      this.epilogue = this.body.slice(idx);
    }
    if (!boundary_found) {
      throw new Error(`no dash-boundary (${boundary}) found`);
    }
    if (!end_found) {
      throw new Error(`no close-delimiter (${boundary}) found`);
    }
  }

  _get_transfer_encoding() {
    const ce = this.hdr_idx["content-transfer-encoding"];
    if (ce && ce[0].parsed && ce[0].parsed.mechanism) return ce[0].parsed.mechanism;
    return "8bit"; // <- the RFC suggests 7bit as default
  }

  _is_identity_encoding(enc: Encoding): boolean {
    switch (enc) {
      case "7bit":
      case "8bit":
      case "binary":
        return true;
    }
    return false;
  }

  /* Call a function “f” to transform each text type body part.
   */
  all_text_parts(f: (body: string, subtype: string) => string) {
    if (this.parts.length) {
      for (const part of this.parts) {
        part.all_text_parts(f);
      }
    } else if (typeof this.decoded === "string") {
      const ct = this.hdr_idx["content-type"];
      const subtype = ct && ct[0].parsed ? ct[0].parsed.subtype : "plain";
      this.decoded = f(this.decoded, subtype);
    }
  }

  /* Decode all text type body parts into a JS string “decoded.”
   */
  decode() {
    if (this.parts.length) {
      for (const part of this.parts) part.decode();
      return;
    }
    if (!this.body) return;

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
        break;
    }

    const ctf = this.hdr_idx["content-type"];
    const ct = ctf ? ctf[0].parsed : parse(default_content_type);

    if (ct.type !== "text") {
      this.decoded = body;
      return;
    }

    const charset = this._get_param("charset", ct.parameters, "utf-8").toLowerCase();

    const iconv = new Iconv(charset, "utf-8");

    // Convert body to “decoded” string.
    try {
      this.decoded = iconv.convert(body).toString();
    } catch (e) {
      const ex = e as NodeJS.ErrnoException;
      if (ex.code === "EILSEQ") {
        ex.message = `Illegal character sequence decoding ${enc}, charset="${charset}"`;
        try {
          // Try again assuming UTF-8.
          this.decoded = body.toString();
          return;
        } catch (ee) {
          const eex = ee as NodeJS.ErrnoException;
          if (eex.code === "EILSEQ") {
            eex.message = `Illegal character sequence decoding ${enc}, charset="${charset}"`;
          }
          throw eex;
        }
      }
      throw ex;
    }
  }

  /* Encode each decoded text body part into a the Buffer “body” using
   * Content-Type and Content-Transfer-Encoding.
   */
  encode() {
    if (this.parts.length) {
      for (const part of this.parts) part.encode();
      return;
    }
    if (!this.decoded) return;

    const ctf = this.hdr_idx["content-type"];
    const ct = ctf ? ctf[0].parsed : parse(default_content_type);

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
          if (!ctf) throw ex; // we should never get a conversion error unless the ctf is set
          const new_ctv = `text/${ctf[0].parsed.subtype}; charset=utf-8`;
          const new_full = `Content-Type: ${new_ctv}\r\n`;
          ctf[0] = {
            name: "Content-Type",
            value: new_ctv,
            full_header: new_full,
            parsed: parse(new_full),
          };
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
        break;
    }
  }

  change_boundary() {
    const ct = this.hdr_idx["content-type"];
    if (!(ct && ct[0] && ct[0].parsed.type === "multipart")) return;
    for (const param of ct[0].parsed.parameters) if (param.boundary) param.boundary = `"=_${hash(param.boundary)}_="`;
  }

  get_data() {
    // Horrendous inefficient Buffer copies, could be improved.
    let buf = Buffer.alloc(0);

    for (const hdr of this.headers) {
      buf = Buffer.concat([buf, Buffer.from(`${hdr.name}: ${hdr.value}\r\n`)]);
    }

    if (this.parts.length) {
      const boundary = this._get_boundary();
      if (!boundary) {
        throw new Error(`multiple parts without a boundary`);
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
   */
  rewrite_headers() {
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
