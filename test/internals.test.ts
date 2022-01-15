import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

describe("test internal methods of Message class", () => {
  it("_set_field", () => {
    const msg_text =
      Buffer.from(
        dedent`Received: from o1.email.arclightcinemas.com (o1.email.arclightcinemas.com [208.117.52.243])
        	by digilicious.com (Postfix) with SMTP id F090D1E28AC
        	for <gene@digilicious.com>; Tue, 14 Aug 2012 15:34:57 -0700 (PDT)
        Received: by 10.4.35.204 with SMTP id mf47.26375.502AD2911
         Tue, 14 Aug 2012 17:34:57 -0500 (CDT)
        Received: from 217182-9 (unknown [10.8.49.124])
        	by mi18 (SG) with ESMTP id 502ad290.78ab.574a44
        	for <gene@digilicious.com>; Tue, 14 Aug 2012 17:34:56 -0500 (CST)
        `.replace(/\n/g, "\r\n")
      ) + "\r\n";

    const msg = new Message(Buffer.from(msg_text), MessageType.part);

    const key = "received";
    expect(msg.hdr_idx[key].length).toEqual(3);

    msg._set_field(key, "for <foo@example.com> ; Tue, 14 Aug 2012 17:34:56 -0500 (CST)");
    msg.rewrite_headers();

    expect(msg.hdr_idx[key].length).toEqual(1);

    const msg2 = new Message(msg.get_data(), MessageType.part);

    expect(msg2.hdr_idx[key].length).toEqual(1);
  });
});
