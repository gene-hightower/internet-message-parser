import dedent from "ts-dedent";

import { Message, is_structured_header } from "../lib/Message";

describe("RFC-822 examples", () => {
  it("A.3.1. Minimum required", () => {
    const msg_text = Buffer.from(dedent`
        Date:     26 Aug 76 14:29 EDT
        From:     Jones@Registry.Org
        Bcc:
    `.replace("\n", "\r\n") + "\r\n"); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("A.3.1. “or” Minimum required", () => {
    const msg_text = Buffer.from(dedent`
        Date:     26 Aug 76 14:29 EDT (the ':' is required by RFC-822 syntax)
        From:     Jones@Registry.Org
        To:       Smith@Registry.Org
    `.replace("\n", "\r\n") + "\r\n"); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
  });

  it("A.3.2. Using some of the additional fields", () => {
    const msg_text = Buffer.from(dedent`
        Date:     26 Aug 76 14:30 EDT
        From:     George Jones<Group@Host>
        Sender:   Secy@SHOST
        To:       "Al Neuman"@Mad-Host,
                  Sam.Irving@Other-Host
        Message-ID:  <some.string@SHOST>
    `.replace("\n", "\r\n") + "\r\n"); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["sender"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);
  });

  it("A.3.3. About as complex as you're going to get", () => {
    const msg_text = Buffer.from(dedent`
        Date     :  27 Aug 76 09:32 PDT (the ':' is required by RFC-822 syntax)
        From     :  Ken Davis <KDavis@This-Host.This-net>
        Subject  :  Re: The Syntax in the RFC
        Sender   :  KSecy@Other-Host
        Reply-To :  Sam.Irving@Reg.Organization
        To       :  George Jones <Group@Some-Reg.An-Org>,
                    Al.Neuman@MAD.Publisher
        cc       :  Important folk:
                      Tom Softwood <Balsa@Tree.Root>,
                      "Sam Irving"@Other-Host;,
                    Standard Distribution:
                      /main/davis/people/standard@Other-Host,
                      "<Jones>standard.dist.3"@Tops-20-Host(>); (Clearly not matching)
        Comment  :  Sam is away on business. He asked me to handle
                    his mail for him.  He'll be able to provide  a
                    more  accurate  explanation  when  he  returns
                    next week.
        In-Reply-To: <some.string@DBM.Group>(,) George's message (See: RFC-822 section C.3.5.)
        X-Special-action:  This is a sample of user-defined field-
                    names.  There could also be a field-name
                    "Special-action", but its name might later be
                    preempted
        Message-ID: <4231.629.XYzi-What@Other-Host>
    `.replace("\n", "\r\n") + "\r\n"); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["subject"][0]); // <- unstructured
    expect(msg.hdr_idx["sender"][0].parsed);
    expect(msg.hdr_idx["reply-to"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["cc"][0].parsed);
    expect(msg.hdr_idx["comment"][0]); // <- unstructured
    expect(msg.hdr_idx["in-reply-to"][0].parsed);
    expect(msg.hdr_idx["x-special-action"][0]); // <- non-standard
    expect(msg.hdr_idx["message-id"][0].parsed);
  });

});
