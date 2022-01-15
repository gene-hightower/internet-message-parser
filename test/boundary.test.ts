import dedent from "ts-dedent";

import { Message } from "../lib/Message";

describe("Rewrite multipart boundaries", () => {
  it("assure message is not otherwise altered", () => {
    const preamble = dedent`
        This is the preamble.  It is to be ignored, though it
        is a handy place for composition agents to include an
        explanatory note to non-MIME conformant readers.
      `;

    const epilogue = dedent`
          This is the epilogue.  It is also to be ignored.
      `;

    const part0 = dedent`
        This is implicitly typed plain US-ASCII text.
        It does NOT end with a linebreak.
      `;
    expect(part0[part0.length - 1]).toEqual(".");

    const type = "text";
    const subtype = "plain";
    const charset = "US-ASCII";
    const part1 = dedent`
        This is explicitly typed ${subtype} ${charset} ${type}.
        It DOES end with a linebreak.

      `;
    expect(part1[part1.length - 1]).toEqual("\n");

    const boundary = "simple boundary"; // no regexp special chars in this
    const subject = "Sample message";
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: ${subject}
        MIME-Version: 1.0
        Content-type: multipart/mixed; boundary="${boundary}"

        ${preamble}
        --${boundary}

        ${part0}
        --${boundary}
        Content-type: ${type}/${subtype}; charset=${charset}

        ${part1}
        --${boundary}--
        ${epilogue}
    `.replace(/\n/g, "\r\n")
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["subject"][0].value).toEqual(subject);

    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("multipart");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("mixed");

    if (!msg.preamble) fail("expecting a preamble");
    expect(msg.preamble.toString()).toEqual(preamble.replace(/\n/g, "\r\n"));

    expect(msg.parts.length).toEqual(2);
    expect(msg.parts[0].decoded).toEqual(part0.replace(/\n/g, "\r\n"));
    expect(msg.parts[1].decoded).toEqual(part1.replace(/\n/g, "\r\n"));

    if (!msg.epilogue) fail("expecting epilogue");
    expect(msg.epilogue.toString()).toEqual(epilogue.replace(/\n/g, "\r\n"));

    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");

    const bound_re = RegExp(boundary);

    // Be sure we can find the boundary.
    expect(msg_text.toString()).toMatch(bound_re);

    msg.change_boundary();
    msg.rewrite_headers();

    const raw_new_boundary = msg.get_data();

    // Be sure the old boundary is no longer used.
    expect(raw_new_boundary.toString()).not.toMatch(bound_re);

    const msg_new_boundary = new Message(raw_new_boundary);
    msg_new_boundary.decode();

    // Verify the newly reconstituted message parses the same.
    expect(msg_new_boundary.hdr_idx["from"][0].parsed).toEqual(msg.hdr_idx["from"][0].parsed);
    expect(msg_new_boundary.hdr_idx["to"][0].parsed).toEqual(msg.hdr_idx["to"][0].parsed);
    expect(msg_new_boundary.hdr_idx["date"][0].parsed).toEqual(msg.hdr_idx["date"][0].parsed);
    expect(msg_new_boundary.hdr_idx["subject"][0].value).toEqual("Sample message");

    expect(msg_new_boundary.hdr_idx["content-type"][0].parsed.type).toEqual("multipart");
    expect(msg_new_boundary.hdr_idx["content-type"][0].parsed.subtype).toEqual("mixed");

    // We don't write a preamble or epilogue.
    expect(msg_new_boundary.preamble).toEqual(null);
    expect(msg_new_boundary.epilogue).toEqual(null);

    // Make sure the parts match.
    expect(msg_new_boundary.parts.length).toEqual(2);
    expect(msg_new_boundary.parts[0].decoded).toEqual(msg.parts[0].decoded);
    expect(msg_new_boundary.parts[1].decoded).toEqual(msg.parts[1].decoded);
  });

  it("Digest Subtype", () => {
    const msg_text = Buffer.from(
      dedent`
     From: Moderator-Address@example.com (not sure what 'Moderator-Address' with no domain is)
     To: Recipient-List@example.net (not sure what 'Recipient-List' with no domain is)
     Date: Mon, 22 Mar 1994 13:34:51 +0000
     Subject: Internet Digest, volume 42
     MIME-Version: 1.0
     Content-Type: multipart/mixed;
                   boundary="---- main boundary ----"

     ------ main boundary ----

       ...Introductory text or table of contents...

     ------ main boundary ----
     Content-Type: multipart/digest;
                   boundary="---- next message ----"

     ------ next message ----

     From: someone-else@example.com
     Date: Fri, 26 Mar 1993 11:13:32 +0200
     Subject: my opinion

       ...body goes here ...

     ------ next message ----

     From: someone-else-again@example.net
     Date: Fri, 26 Mar 1993 10:07:13 -0500
     Subject: my different opinion

       ... another body goes here ...

     ------ next message ------

     ------ main boundary ------
    `.replace(/\n/g, "\r\n")
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();
    msg.change_boundary();
    msg.rewrite_headers();
    msg.encode();

    /*
    const raw_new_boundary = msg.get_data();
    const msg_new_boundary = new Message(raw_new_boundary);
    msg_new_boundary.decode();

    // Make sure the parts match.
    expect(msg_new_boundary.parts.length).toEqual(msg.parts.length);
    for (let p=0; p<msg.parts.length; ++p) {
      expect(msg_new_boundary.parts[p].decoded).toEqual(msg.parts[p].decoded);
    }
    */
  });
});
