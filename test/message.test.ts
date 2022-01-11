import dedent from "dedent";

import { Message, is_structured_header } from "../lib/Message";

describe("RFC-822 examples", () => {
  it("A.3.1.  Minimum required", () => {
    const msg_text = dedent`
        Date:     26 Aug 76 1429 EDT
        From:     Jones@Registry.Org
        Bcc:
    `.replace("\n", "\r\n"); // CRLF line endings

    const msg = Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  if (
    ("A.3.1. “or” Minimum required",
    () => {
      const msg_text = dedent`
        Date:     26 Aug 76 1429 EDT
        From:     Jones@Registry.Org
        To:       Smith@Registry.Org
    `.replace("\n", "\r\n"); // CRLF line endings

      const msg = Message(msg_text);

      expect(msg.hdr_idx["date"][0].parsed);
      expect(msg.hdr_idx["from"][0].parsed);
      expect(msg.hdr_idx["to"][0].parsed);
    })
  );
});
