import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

describe("RFC-822 full header examples", () => {
  it("The DDG test", () => {
    const msg_text = Buffer.from(
      dedent`Subject: Sample message
                                        MIME-Version: 1.0
                                        Content-type: multipart / mixed; boundary = (is what?) "simple boundary"
                                        To: Some Random User <random@mailhog.duck>
                                        Received: by haraka.duck; Fri, 14 Jan 2022 18:38:59 +0000
                                        Message-ID: <7B2A3F04-9FEB-4947-8E99-6563ADB1CA93.1@haraka.duck>
                                        Date: Fri, 14 Jan 2022 18:38:59 +0000
                                        From: duckuser@haraka.duck

                                        --simple boundary
                                        Content-type: text / plain; charset = (not Unicode) us-ascii

                                        This is explicitly typed plain US-ASCII text.
                                        It DOES end with a linebreak.

                                        --simple boundary--
                                        `.replace(/\n/g, "\r\n")
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();
    msg.change_boundary();
    msg.rewrite_headers();
    msg.encode();

    const msg2 = new Message(msg.get_data());
    msg.decode();

    expect(msg2.hdr_idx["date"][0].parsed);
    expect(msg2.hdr_idx["from"][0].parsed);
  });

  it("A.3.1. Minimum required", () => {
    const msg_text = Buffer.from(
      dedent`
        Date:     26 Aug 76 14:29 EDT
        From:     Jones@Registry.Org
        Bcc:
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
  });

  it("A.3.1. “or” Minimum required", () => {
    const msg_text = Buffer.from(
      dedent`
        Date:     26 Aug 76 14:29 EDT (the ':' is required by RFC-822 syntax)
        From:     Jones@Registry.Org
        To:       Smith@Registry.Org
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
  });

  it("A.3.2. Using some of the additional fields", () => {
    const msg_text = Buffer.from(
      dedent`
        Date:     26 Aug 76 14:30 EDT
        From:     George Jones<Group@Host>
        Sender:   Secy@SHOST
        To:       "Al Neuman"@Mad-Host,
                  Sam.Irving@Other-Host
        Message-ID:  <some.string@SHOST>
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["sender"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);
  });

  it("A.3.3. About as complex as you're going to get", () => {
    const msg_text = Buffer.from(
      dedent`
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
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);

    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["subject"][0].value).toEqual("Re: The Syntax in the RFC");
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

describe("RFC-5322 A.1. Addressing Examples", () => {
  it("A.1.1. A Message from One Person to Another with Simple Addressing", () => {
    const msg_text = Buffer.from(
      dedent`
        From: John Doe <jdoe@machine.example>
        To: Mary Smith <mary@example.net>
        Subject: Saying Hello
        Date: Fri, 21 Nov 1997 09:55:06 -0600
        Message-ID: <1234@local.machine.example>

        This is a message just to say hello.
        So, "Hello".
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]); // <- unstructured
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual('This is a message just to say hello.\r\nSo, "Hello".\r\n');
  });

  it("A.1.2 Different Types of Mailboxes", () => {
    const msg_text = Buffer.from(
      dedent`
        From: "Joe Q. Public" <john.q.public@example.com>
        To: Mary Smith <mary@x.test>, jdoe@example.org, Who? <one@y.test>
        Cc: <boss@nil.test>, "Giant; \\"Big\\" Box" <sysservices@example.net>
        Date: Tue, 1 Jul 2003 10:52:37 +0200
        Message-ID: <5678.21-Nov-1997@example.com>

        Hi everyone.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["cc"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual("Hi everyone.\r\n");
  });

  it("A.1.3 Group Addresses", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Pete <pete@silly.example>
        To: A Group:Ed Jones <c@a.test>,joe@where.test,John <jdoe@one.test>;
        Cc: Undisclosed recipients:;
        Date: Thu, 13 Feb 1969 23:32:54 -0330
        Message-ID: <testabcd.1234@silly.example>

        Testing.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);

    expect(msg.hdr_idx["cc"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual("Testing.\r\n");
  });
});

describe("RFC-5322 A.2. Reply Messages", () => {
  it("A.2 Reply Message", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Mary Smith <mary@example.net>
        To: John Doe <jdoe@machine.example>
        Reply-To: "Mary Smith: Personal Account" <smith@home.example>
        Subject: Re: Saying Hello
        Date: Fri, 21 Nov 1997 10:01:10 -0600
        Message-ID: <3456@example.net>
        In-Reply-To: <1234@local.machine.example>
        References: <1234@local.machine.example>

        This is a reply to your hello.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["reply-to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]); // <- unstructured
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);
    expect(msg.hdr_idx["in-reply-to"][0].parsed);
    expect(msg.hdr_idx["references"][0].parsed);

    expect(msg.decoded).toEqual("This is a reply to your hello.\r\n");
  });
});

describe("RFC-5322 A.3. Resent Messages", () => {
  it("A.3 Resent Message", () => {
    const msg_text = Buffer.from(
      dedent`
        Resent-From: Mary Smith <mary@example.net>
        Resent-To: Jane Brown <j-brown@other.example>
        Resent-Date: Mon, 24 Nov 1997 14:22:01 -0800
        Resent-Message-ID: <78910@example.net>
        From: John Doe <jdoe@machine.example>
        To: Mary Smith <mary@example.net>
        Subject: Saying Hello
        Date: Fri, 21 Nov 1997 09:55:06 -0600
        Message-ID: <1234@local.machine.example>

        This is a message just to say hello.
        So, "Hello".
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["resent-from"][0].parsed);
    expect(msg.hdr_idx["resent-to"][0].parsed);
    expect(msg.hdr_idx["resent-date"][0].parsed);
    expect(msg.hdr_idx["resent-message-id"][0].parsed);

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]); // <- unstructured
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual('This is a message just to say hello.\r\nSo, "Hello".\r\n');
  });
});

describe("RFC-5322 A.4. Messages with Trace Fields", () => {
  it("A.4 Message with Trace Fields", () => {
    const msg_text = Buffer.from(
      dedent`
        Received: from x.y.test
           by example.net
           via TCP
           with ESMTP
           id ABC12345
           for <mary@example.net>;  21 Nov 1997 10:05:43 -0600
        Received: from node.example by x.y.test; 21 Nov 1997 10:01:22 -0600
        From: John Doe <jdoe@node.example>
        To: Mary Smith <mary@example.net>
        Subject: Saying Hello
        Date: Fri, 21 Nov 1997 09:55:06 -0600
        Message-ID: <1234@local.node.example>

        This is a message just to say hello.
        So, "Hello".
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["received"][0].parsed);
    expect(msg.hdr_idx["received"][1].parsed);

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]); // <- unstructured
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual('This is a message just to say hello.\r\nSo, "Hello".\r\n');
  });
});

describe("RFC-5322 A.5. White Space, Comments, and Other Oddities", () => {
  it("A.5 White Space, Comments, and Other Oddities", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Pete(A nice \\) chap) <pete(his account)@silly.test(his host)>
        To:A Group(Some people)
             :Chris Jones <c@(Chris's host.)public.example>,
                 joe@example.org,
          John <jdoe@one.test> (my dear friend); (the end of the group)
        Cc:(Empty list)(start)Hidden recipients  :(nobody(that I know))  ;
        Date: Thu,
              13
                Feb
                  1969
              23:32
                       -0330 (Newfoundland Time)
        Message-ID:              <testabcd.1234@silly.test>

        Testing.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["cc"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);

    expect(msg.decoded).toEqual("Testing.\r\n");
  });
});

describe("RFC-2045", () => {
  it("MIME-Version", () => {
    const msg_text = Buffer.from(
      dedent`
        MIME-Version: 1.0
        MIME-Version: 1.0 (produced by MetaSend Vx.x)
        MIME-Version: (produced by MetaSend Vx.x) 1.0
        MIME-Version: 1.(produced by MetaSend Vx.x)0
        MIME-Version: 1 . 0 (Implementation by Fred Nerk, Esq.)
        MIME-Version:
                      1
                      .
                      0 (This too, should be fine.)
        Content-type: (comments can fool some (lesser) parsers) text (like) / plain (like); charset (is) = (us?) us-ascii (Plain text)
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text, MessageType.part);
    msg.decode();

    expect(msg.hdr_idx["mime-version"][0].parsed);
    expect(msg.hdr_idx["content-type"][0].parsed);
    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");
  });
});

describe("RFC-2046 5.1.1. Common Syntax", () => {
  it("multipart, simple boundary", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Nathaniel Borenstein <nsb@bellcore.com>
        To: Ned Freed <ned@innosoft.com>
        Date: Sun, 21 Mar 1993 23:56:48 -0800 (PST)
        Subject: Sample message
        MIME-Version: 1.0
        Content-type: multipart / mixed; boundary = (a very) "simple boundary"

        This is the preamble.  It is to be ignored, though it
        is a handy place for composition agents to include an
        explanatory note to non-MIME conformant readers.

        --simple boundary

        This is implicitly typed plain US-ASCII text.
        It does NOT end with a linebreak.
        --simple boundary
        Content-type: text / plain; charset = us-ascii

        This is explicitly typed plain US-ASCII text.
        It DOES end with a linebreak.

        --simple boundary--

        This is the epilogue.  It is also to be ignored.
    `.replace(/\n/g, "\r\n")
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["subject"][0].value).toEqual("Sample message");

    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("multipart");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("mixed");

    expect(msg.preamble).toEqual(
      Buffer.from(
        dedent`
        This is the preamble.  It is to be ignored, though it
        is a handy place for composition agents to include an
        explanatory note to non-MIME conformant readers.

      `.replace(/\n/g, "\r\n")
      )
    );

    expect(msg.parts.length).toEqual(2);
    expect(msg.parts[0].decoded).toEqual(
      `This is implicitly typed plain US-ASCII text.\r\nIt does NOT end with a linebreak.`
    );
    expect(msg.parts[1].decoded).toEqual(
      `This is explicitly typed plain US-ASCII text.\r\nIt DOES end with a linebreak.\r\n`
    );

    expect(msg.epilogue).toEqual(
      Buffer.from(
        dedent`

          This is the epilogue.  It is also to be ignored.
      `.replace(/\n/g, "\r\n")
      )
    );

    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");
  });
});

describe("RFC-2046 5.2.3.7. Examples and Further Explanations", () => {
  it("message/external-body", () => {
    const msg_text = Buffer.from(
      dedent`
        From: Whomever@example.com
        To: Someone@example.com
        Date: Fri, 21 Nov 1997 09:55:06 -0600
        Subject: whatever
        MIME-Version: 1.0
        Message-ID: <id1@host.com>
        Content-Type: multipart/alternative; boundary=42
        Content-ID: <id001@guppylake.bellcore.com>

        --42
        Content-Type: message/external-body; name="BodyFormats.ps";
                      site="thumper.bellcore.com"; mode="image";
                      access-type=ANON-FTP; directory="pub";
                      expiration="Fri, 14 Jun 1991 19:13:14 -0400 (EDT)"

        Content-type: application/postscript
        Content-ID: <id42@guppylake.bellcore.com>

        --42
        Content-Type: message/external-body; access-type=local-file;
                      name="/u/nsb/writing/rfcs/RFC-MIME.ps";
                      site="thumper.bellcore.com";
                      expiration="Fri, 14 Jun 1991 19:13:14 -0400 (EDT)"

        Content-type: application/postscript
        Content-ID: <id42@guppylake.bellcore.com>

        --42
        Content-Type: message/external-body;
                      access-type=mail-server;
                      server="listserv@bogus.bitnet";
                      expiration="Fri, 14 Jun 1991 19:13:14 -0400 (EDT)"

        Content-type: application/postscript
        Content-ID: <id42@guppylake.bellcore.com>

        get RFC-MIME.DOC

        --42--
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["subject"][0].value).toEqual("whatever");

    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("multipart");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("alternative");

    expect(msg.parts.length).toEqual(3);

    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.type).toEqual("message");
    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.subtype).toEqual("external-body");
  });
});
