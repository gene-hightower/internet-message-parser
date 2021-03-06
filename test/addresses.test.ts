import { Message, MessageType } from "../lib/Message";

describe("address-list", () => {
  it("single addr-spec", () => {
    const msg_text = Buffer.from(`From: foo@example.com\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("list of two addr-specs", () => {
    const msg_text = Buffer.from(`From: foo@example.com, bar@example.com\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr", () => {
    const msg_text = Buffer.from(`From: Mr Foo <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name with quoted-string", () => {
    const msg_text = Buffer.from(`From: "Mr. Foo" <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name with quoted-string", () => {
    const msg_text = Buffer.from(`From: "Foo, Mr" <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name with multiple quoted-strings", () => {
    const msg_text = Buffer.from(`From: "Mr." "Foo" <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name with .", () => {
    const msg_text = Buffer.from(`From: Mr. Foo <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name with ,", () => {
    const msg_text = Buffer.from(`From: One, Two <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("single name-addr, display-name as an address", () => {
    const msg_text = Buffer.from(`From: foo@example.com <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("list of two name-addrs", () => {
    const msg_text = Buffer.from(`From: Joe Foo <foo@example.com>, Bar Baz <baz@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("list of two name-addrs with quoted-strings", () => {
    const msg_text = Buffer.from(`From: "Joe Foo" <foo@example.com>, "Bar Baz" <baz@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("quoted semicolon", () => {
    const msg_text = Buffer.from(`From: "one; two" <foo@example.com>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("emtpy group", () => {
    const msg_text = Buffer.from(`From: Undisclosed:;\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("address group", () => {
    const msg_text = Buffer.from(`From: Disclosed:foo@example.com, bar@example.com;\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("adapted from Programming Internet Email", () => {
    const msg_text = Buffer.from(`To: Fred. (The Eliminator) <Nerk@movieworld.com.au>\r\n`);
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["to"][0].parsed);
  });

  // Not sure if this should be accepted.
  it.skip("mixed group", () => {
    const msg_text = Buffer.from(
      `From: Foo <foo@example.com>, Disclosed:baz@example.net, bix@example.com;,,,, Undisclosed:;\r\n`
    );
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  // Not sure if this should be accepted.
  it.skip("semicolon / group", () => {
    const msg_text = Buffer.from(
      `From: Test User <test.user@mail.ee>; Disclosed:andris@tr.ee, andris@example.com;,,,, Undisclosed:; bob@example.com;\r\n`
    );
    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["from"][0].parsed);
  });
});

describe("ill formed address-list", () => {
  it("junk before address", () => {
    const msg_text = Buffer.from(`From: foo foo@example.com\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in From: header #1 (From: foo foo@example.com)");
      return;
    }
    fail("expecting excpetion");
  });

  it("just a comment", () => {
    const msg_text = Buffer.from(`From: (nothing here)\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in From: header #1 (From: (nothing here))");
      return;
    }
    fail("expecting excpetion");
  });

  it("junk after address", () => {
    const msg_text = Buffer.from(`From: foo@example.com (bar) baz\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in From: header #1 (From: foo@example.com (bar) baz)");
      return;
    }
    fail("expecting excpetion");
  });

  it.skip("bare name", () => {
    const msg_text = Buffer.from(`From: Foo\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual("syntax error in From: header #1 (From: Foo)");
      return;
    }
    fail("expecting excpetion");
  });

  it.skip("bare name with apostrophe", () => {
    const msg_text = Buffer.from(`From: O'A\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual(`syntax error in From: header #1 (From: O'A`);
      return;
    }
    fail("expecting excpetion");
  });

  it.skip("particularily bad input", () => {
    const msg_text = Buffer.from(`From: FirstName Surname-WithADash :: Company <name@example.com>\r\n`);
    try {
      const msg = new Message(msg_text, MessageType.part);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual(
        "syntax error in From: header #1 (From: FirstName Surname-WithADash :: Company <name@example.com>)"
      );
      return;
    }
    fail("expecting excpetion");
  });
});
