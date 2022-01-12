import dedent from "ts-dedent";

import { Message } from "../lib/Message";

describe("Parse failures", () => {
  it("bad Date: syntax", () => {
    const msg_text = Buffer.from(
      dedent`
        Date:     26 Aug 76 1429 EDT (missing ':' between hours and minutes)
        From:     Jones@Registry.Org
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    try {
      const msg = new Message(msg_text);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual('syntax error in Date: header');
      return;
    }

    fail('expecting bad Date: syntax excpetion');
  });





});
