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
});
