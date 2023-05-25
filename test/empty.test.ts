import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";
import { ContentType } from "../lib/message-types";
import { SyntaxError, parse, structuredHeaders } from "../lib/message-parser";

describe("empty messages", () => {
  it("no end to header section", () => {
    const msg_text = Buffer.from(
      dedent`
                                 Date: Sat, 06 Dec 2003 15:41:26 +0000
                                 From: Peter Bloomfield <PeterBloomfield@bellsouth.net>
                                 To: Peter Bloomfield <PeterBloomfield@BellSouth.net>
                                 X-Mailer: Balsa 2.1.0
                                 Message-Id: <1070725286l.24763l.0l@Mercury>
                                 Status: RO
                                 MIME-Version: 1.0
                                 Content-Type: text/plain; charset=ISO-8859-1; DelSp=Yes; Format=Flowed
                                 Content-Disposition: inline
                                 Content-Transfer-Encoding: quoted-printable
                                 Subject: No Subject`.replace(/\n/g, "\r\n")
    );
    try {
      const msg = new Message(Buffer.from(msg_text), MessageType.part);

      msg.decode();
      msg.encode();
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual('unknown string at 394: "Subject: No Subject"');
      return;
    }

    fail('expecting (unknown string at 394: "Subject: No Subject") excpetion');
  });

  it("no body", () => {
    const msg_text = Buffer.from(
      dedent`
                                 Date: Sat, 06 Dec 2003 15:41:26 +0000
                                 From: Peter Bloomfield <PeterBloomfield@bellsouth.net>
                                 To: Peter Bloomfield <PeterBloomfield@BellSouth.net>
                                 X-Mailer: Balsa 2.1.0
                                 Message-Id: <1070725286l.24763l.0l@Mercury>
                                 Status: RO
                                 MIME-Version: 1.0
                                 Content-Type: text/plain; charset=ISO-8859-1; DelSp=Yes; Format=Flowed
                                 Content-Disposition: inline
                                 Content-Transfer-Encoding: quoted-printable
                                 Subject: No Subject
                                 `.replace(/\n/g, "\r\n") + "\r\n"
    );
    const msg = new Message(Buffer.from(msg_text), MessageType.part);

    msg.decode();
    msg.encode();

    expect(msg.body).toEqual(null);

    const msg2 = new Message(msg.get_data());

    msg2.decode();
    msg2.encode();
  });

  it("empty body", () => {
    const msg_text = Buffer.from(
      dedent`
                                 Date: Sat, 06 Dec 2003 15:41:26 +0000
                                 From: Peter Bloomfield <PeterBloomfield@bellsouth.net>
                                 To: Peter Bloomfield <PeterBloomfield@BellSouth.net>
                                 X-Mailer: Balsa 2.1.0
                                 Message-Id: <1070725286l.24763l.0l@Mercury>
                                 Status: RO
                                 MIME-Version: 1.0
                                 Content-Type: text/plain; charset=ISO-8859-1; DelSp=Yes; Format=Flowed
                                 Content-Disposition: inline
                                 Content-Transfer-Encoding: quoted-printable
                                 Subject: No Subject
                                 `.replace(/\n/g, "\r\n") + "\r\n\r\n"
    );
    const msg = new Message(Buffer.from(msg_text), MessageType.part);

    msg.decode();
    msg.encode();

    expect(msg.body).toEqual(Buffer.from(""));

    const msg2 = new Message(msg.get_data());

    msg2.decode();
    msg2.encode();
  });
});
