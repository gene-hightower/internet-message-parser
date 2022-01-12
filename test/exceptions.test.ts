import dedent from "ts-dedent";

import { Message } from "../lib/Message";

describe("Parse failures", () => {
  it("bad header syntax", () => {
    const msg_text = Buffer.from(
      dedent`
        Date: 26 Aug 76 14:29 EDT
        something not a header
        From: Jones@Registry.Org
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual('unknown string at 27: "something not a header"');
      return;
    }

    fail("expecting unknown string syntax excpetion");
  });

  it("bad Date: syntax", () => {
    const msg_text = Buffer.from(
      dedent`
        Date: 26 Aug 76 1429 EDT (missing ':' between hours and minutes)
        From: Jones@Registry.Org
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in Date: header");
      return;
    }

    fail("expecting bad Date: syntax excpetion");
  });

  it("missing From: header", () => {
    const msg_text = Buffer.from(
      dedent`
        Date:     26 Aug 76 14:29 EDT
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("missing From: header");
      return;
    }

    fail('expecting "missing From: header" excpetion');
  });

  it("too many From: headers", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Jones@Registry.Org
        Date: 26 Aug 76 14:29 EDT
        From: Smith@Registry.Com
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("too many From: headers");
      return;
    }

    fail('expecting "too many From: headers" excpetion');
  });

  it("no recipient", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Jones@Registry.Org
        Date: 26 Aug 76 14:29 EDT
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("must have a recipient, one of To:, Cc:, or Bcc:");
      return;
    }

    fail('expecting "must have a recipient, one of To:, Cc:, or Bcc:" excpetion');
  });

  it("no Sender: header", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Jones@Registry.Org, Smith@Registry.Org
        Date: 26 Aug 76 14:29 EDT
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("must have Sender: if more than one address in From:");
      return;
    }

    fail('expecting "must have Sender: if more than one address in From:" excpetion');
  });

  it("check for conflicting charset parameters", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Jones@Registry.Org
        Date: 26 Aug 76 14:29 EDT
        Bcc:
        MIME-Version: 1.0
        Content-Type: text/plain; charset=UTF-8; charset=us-ascii

        Text body.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    try {
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("found multiple conflicting charset parameters");
      return;
    }

    fail('expecting "found multiple conflicting charset parameters" excpetion');
  });

  it("check for missing boundary parameter", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Jones@Registry.Org
        Date: 26 Aug 76 14:29 EDT
        Bcc:
        MIME-Version: 1.0
        Content-Type: multipart/alternative; (no boundary) foo=bar

        Text body.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("parameter boundary not found");
      return;
    }

    fail('expecting "parameter boundary not found" excpetion');
  });

  it("multipart, invalid character in boundary", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Bcc:
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="bad@boundary"

        Text body.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("invalid character in multipart boundary (bad@boundary)");
      return;
    }

    fail('expecting "invalid character in multipart boundary…" excpetion');
  });

  it("multipart, boundary ends with a space", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Bcc:
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="bad boundary "

        Text body.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("multipart boundary must not end with a space");
      return;
    }

    fail('expecting "multipart boundary must not end with a space" excpetion');
  });

  it("multipart, multiple close-delimiter lines", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: Sample message
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="simple boundary"

        This is the preamble.  It is to be ignored, though it
        is a handy place for composition agents to include an
        explanatory note to non-MIME conformant readers.

        --simple boundary

        This is implicitly typed plain US-ASCII text.
        It does NOT end with a linebreak.
        --simple boundary--
        Content-type: text/plain; charset=us-ascii

        This is explicitly typed plain US-ASCII text.
        It DOES end with a linebreak.

        --simple boundary--

        This is the epilogue.  It is also to be ignored.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("redundant copy of close-delimiter at offset 410");
      return;
    }

    fail('expecting "redundant copy of close-delimiter at offset 410" excpetion');
  });

  it("multipart, close-delimiter before first dash-boundary", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: Sample message
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="simple boundary"

        This is the preamble.  It is to be ignored, though it
        is a handy place for composition agents to include an
        explanatory note to non-MIME conformant readers.

        --simple boundary--

        This is implicitly typed plain US-ASCII text.
        It does NOT end with a linebreak.
        --simple boundary
        Content-type: text/plain; charset=us-ascii

        This is explicitly typed plain US-ASCII text.
        It DOES end with a linebreak.

        --simple boundary

        This is the epilogue.  It is also to be ignored.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("close-delimiter found at offset 160 before any dash-boundary");
      return;
    }

    fail('expecting "close-delimiter found at offset 160 before any dash-boundary" excpetion');
  });

  it("multipart, no dash-boundary", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: Sample message
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="simple boundary"

        Message body with no boundary.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("no dash-boundary (simple boundary) found");
      return;
    }

    fail('expecting "no dash-boundary (simple boundary) found" excpetion');
  });

  it("multipart, no close-delimiter", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: Sample message
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="simple boundary"

        --simple boundary

        This is implicitly typed plain US-ASCII text.
        It does NOT end with a linebreak.
        --simple boundary
        Content-type: text/plain; charset=us-ascii

        This is explicitly typed plain US-ASCII text.
        It DOES end with a linebreak.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("no close-delimiter (simple boundary) found");
      return;
    }

    fail('expecting "no close-delimiter (simple boundary) found" excpetion');
  });

  it("unknown Content-Transfer-Encoding:", () => {
    const msg_text = Buffer.from(
      dedent`
        Message-ID: <whatever@example.com>
        Date: Mon, 10 Jan 2022 01:59:08 -0800
        From: foo@example.com
        To: bar@example.net
        Subject: some text
        Mime-Version: 1.0
        Content-Type: text/plain; charset="UTF-8"
        Content-Transfer-Encoding: unknown

        Message body.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings
    try {
      const msg = new Message(msg_text);
      msg.decode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in Content-Transfer-Encoding: header");
      return;
    }

    fail('expecting "syntax error in Content-Transfer-Encoding: header" excpetion');
  });
});
