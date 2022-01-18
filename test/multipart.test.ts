import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";
import { ContentType } from "../lib/message-types";
import { SyntaxError, parse, structuredHeaders } from "../lib/message-parser";

describe("test multiple parts", () => {
  it("message/rfc822", () => {
    const msg_text =
      Buffer.from(
        dedent`Content-Type: MESSAGE/RFC822

               From: me@myself.com
               To: me@myself.com
               Subject: A test of message/rfc822
               MIME-Version: 1.0
               Content-Type: multipart/mixed; boundary=x

               --x
               Content-Type: text/plain

               Plain text.

               --x
               Content-Type: application/octet-stream

               Random data.

               --x--
        `.replace(/\n/g, "\r\n")
      );
    const msg = new Message(Buffer.from(msg_text), MessageType.part);

    msg.decode();
    msg.change_boundary();
    msg.rewrite_headers();
    msg.encode();

  });

  it("lots of nested parts", () => {
    const msg_text =
      Buffer.from(
        dedent`From: me@myself.com
               To: me@myself.com
               Subject: Sample message structure for IMAP part specifiers
               MIME-Version: 1.0
               Content-Type: MULTIPART/MIXED; boundary="x"

               --x
               Content-Type: TEXT/PLAIN

               This part specifier should be: 1

               --x
               Content-Type: APPLICATION/OCTET-STREAM

               This part specifier should be: 2

               --x
               Content-Type: MESSAGE/RFC822

               From: me@myself.com
               To: me@myself.com
               Subject: This part specifier should be: 3
               MIME-Version: 1.0
               Content-Type: MULTIPART/MIXED; boundary="3.x"

               --3.x
               Content-Type: TEXT/PLAIN

               This part specifier should be: 3.1

               --3.x
               Content-Type: APPLICATION/OCTET-STREAM

               This part specifier should be: 3.2

               --3.x--
               --x
               Content-Type: MULTIPART/MIXED; boundary="4.x"

               --4.x
               Content-Type: IMAGE/GIF

               This part specifier should be: 4.1

               --4.x
               Content-Type: MESSAGE/RFC822

               From: me@myself.com
               To: me@myself.com
               Subject: This part specifier should be: 4.2
               MIME-Version: 1.0
               Content-Type: MULTIPART/MIXED; boundary="4.2.x"

               --4.2.x
               Content-Type: TEXT/PLAIN

               This part specifier should be: 4.2.1

               --4.2.x
               Content-Type: MULTIPART/ALTERNATIVE; boundary="4.2.2.x"

               --4.2.2.x
               Content-Type: TEXT/PLAIN

               This part specifier should be: 4.2.2.1

               --4.2.2.x
               Content-Type: TEXT/RICHTEXT

               This part specifier should be: 4.2.2.2

               --4.2.2.x--
               --4.2.x--
               --4.x--
               (^ This is the one that went missing in the gmime test.)
               --x--
        `.replace(/\n/g, "\r\n")
      );
    const msg = new Message(msg_text);

    expect(msg.parts.length).toEqual(4);

    // I use the zero based array index in the variable names, not the
    // one-based boundary strings and IMAP part specifiers.

    const ct = parse('Content-Type: multipart / mixed; boundary = (a quoted-string) "x"\r\n');
    expect(msg.hdr_idx['content-type'][0].parsed).toEqual(ct);

    const ct_0 = parse('Content-Type: text/plain\r\n');
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_0);

    const ct_1 = parse('Content-Type: application/octet-stream\r\n');
    expect(msg.parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_1);

    const ct_2 = parse('Content-Type: message/rfc822\r\n');
    expect(msg.parts[2].hdr_idx['content-type'][0].parsed).toEqual(ct_2);

    const ct_2_0 = parse('Content-Type: multipart/mixed; boundary="3.x"\r\n');
    expect(msg.parts[2].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_2_0);

    expect(msg.parts[2].parts[0].parts.length).toEqual(2);

    const ct_3 = parse('Content-Type: multipart/mixed; boundary="4.x"\r\n');
    expect(msg.parts[3].hdr_idx['content-type'][0].parsed).toEqual(ct_3);

    const ct_3_0 = parse('Content-Type: image/gif\r\n');
    expect(msg.parts[3].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_3_0);

    const ct_3_1 = parse('Content-Type: message/rfc822\r\n');
    expect(msg.parts[3].parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1);

    const ct_3_1_0 = parse('Content-Type: multipart/mixed; boundary="4.2.x"\r\n');
    expect(msg.parts[3].parts[1].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1_0);

    const ct_3_1_0_0 = parse('Content-Type: text/plain\r\n');
    expect(msg.parts[3].parts[1].parts[0].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1_0_0);

    const ct_3_1_0_1 = parse('Content-Type: multipart/alternative; boundary="4.2.2.x"\r\n');
    expect(msg.parts[3].parts[1].parts[0].parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1_0_1);

    const ct_3_1_0_1_0 = parse('Content-Type: text/plain\r\n');
    expect(msg.parts[3].parts[1].parts[0].parts[1].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1_0_1_0);

    const ct_3_1_0_1_1 = parse('Content-Type: text/richtext\r\n');
    expect(msg.parts[3].parts[1].parts[0].parts[1].parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_3_1_0_1_1);
  });

  it("another example of nested parts", () => {
    const msg_text =
      Buffer.from(
        dedent`Subject: foo bar
              Content-Type: multipart/mixed;
              	boundary="=_X_="
              MIME-Version: 1.0
              To: foo@example.net
              Message-ID: <something-like-an-id@example.net>
              Date: Mon, 17 Jan 2022 16:23:42 -0500
              From: bar@example.com

              --=_X_=
              Content-Type: multipart/related;
              	boundary="=_Y_=";
              	type="multipart/alternative"

              --=_Y_=
              Content-Type: multipart/alternative;
              	boundary="=_Z_="

              --=_Z_=
              Content-Type: text/plain; charset="utf-8"

              Some utf-8 text.
              --=_Z_=
              Content-Type: text/html; charset="utf-8"

              <!doctype html>
              --=_Z_=--
              --=_Y_=
              Content-Type: text/plain; charset=us-ascii
              Content-ID: <b41d80b5d67d@domain>

              Some us-ascii text.
              --=_Y_=--
              --=_X_=
              Content-Type: text/plain; name="v4_uuids.txt"
              Content-Description: v4_uuids.txt
              Content-Disposition: attachment; filename="v4_uuids.txt"; size=92;
              	creation-date="Mon, 17 Jan 2022 21:23:32 GMT";
              	modification-date="Mon, 17 Jan 2022 21:23:38 GMT"
              Content-Transfer-Encoding: base64

              YTQ4OS0wN2Q3NDk1NGVhNWMNCmVhZDllMDg4LTIxOTgtNDI0My1hYzk4LTc5ODYzZjg4ZTFmNw0K
              MmQxYTU1MDgtYjQ2YS00ZmE5LWIyOTItMWM4NzdiYzNlZTYx
              --=_X_=--
        `.replace(/\n/g, "\r\n")
      );
    const msg = new Message(Buffer.from(msg_text), MessageType.part);

    msg.decode();

    expect(msg.parts.length).toEqual(2); // =_X_=
    const ct = parse('Content-Type: multipart/mixed; boundary="=_X_="\r\n');
    expect(msg.hdr_idx['content-type'][0].parsed.type).toEqual(ct.type);
    expect(msg.hdr_idx['content-type'][0].parsed.subtype).toEqual(ct.subtype);
    expect(msg.hdr_idx['content-type'][0].parsed.boundary).toEqual(ct.boundary);

    expect(msg.parts[0].parts.length).toEqual(2); // =_Y_=
    const ct_0 = parse('Content-Type: multipart/related; boundary="=_Y_="\r\n');
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed.type).toEqual(ct_0.type);
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed.subtype).toEqual(ct_0.subtype);
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed.boundary).toEqual(ct_0.boundary);

    expect(msg.parts[0].parts[0].parts.length).toEqual(2); // =_Z_=
    const ct_0_0 = parse('Content-Type: multipart/alternative; boundary="=_Z_="\r\n');
    expect(msg.parts[0].parts[0].hdr_idx['content-type'][0].parsed.type).toEqual(ct_0_0.type);
    expect(msg.parts[0].parts[0].hdr_idx['content-type'][0].parsed.subtype).toEqual(ct_0_0.subtype);
    expect(msg.parts[0].parts[0].hdr_idx['content-type'][0].parsed.boundary).toEqual(ct_0_0.boundary);

    const ct_0_0_0 = parse('Content-Type: text/plain; charset="utf-8"\r\n');
    expect(msg.parts[0].parts[0].parts[0].hdr_idx['content-type'][0].parsed).toEqual(ct_0_0_0);

    const ct_0_0_1 = parse('Content-Type: text/html; charset="utf-8"\r\n');
    expect(msg.parts[0].parts[0].parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_0_0_1);

    const ct_0_1 = parse('Content-Type: text/plain; charset=us-ascii\r\n');
    expect(msg.parts[0].parts[1].hdr_idx['content-type'][0].parsed).toEqual(ct_0_1);

    const ct_1 = parse('Content-Type: text/plain; name="v4_uuids.txt"\r\n');
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed.type).toEqual(ct_0.type);
    expect(msg.parts[0].hdr_idx['content-type'][0].parsed.subtype).toEqual(ct_0.subtype);

    msg.decode();
    msg.change_boundary();
    msg.rewrite_headers();
    msg.encode();
  });
});
