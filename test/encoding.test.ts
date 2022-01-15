import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

const Iconv = require("iconv").Iconv;
const zlib = require("zlib");

describe("Content-Type: encodings", () => {
  it("text/plain; charset=iso-2022-jp, base64", () => {
    const msg_text = Buffer.from(
      dedent`
        Content-Type: text/plain; charset=iso-2022-jp
        Content-Transfer-Encoding: base64

        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
        P2lkPTQK
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings
    const msg = new Message(msg_text, MessageType.part);
    msg.decode();

    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");

    // Look for URL in all that text.
    expect(msg.decoded).toMatch(/http:\/\/www\.1s1yiwu323\.net/);
  });

  it("text/plain; charset=ISO-8859-1, 8bit", () => {
    const msg_text = Buffer.from(
      dedent`
        Message-ID: <whatever@example.com>
        Date: Mon, 10 Jan 2022 01:59:08 -0800
        From: foo@example.com
        To: bar@example.net
        Subject: some text
        Mime-Version: 1.0
        Content-Type: text/plain; charset=ISO-8859-1
        Content-Language: it
        Content-Transfer-Encoding: 8bit

        Wikipedia è un'enciclopedia online, libera e collaborativa.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings
    const iconv = new Iconv("utf-8", "ISO-8859-1");
    const iso8859_text = iconv.convert(msg_text);
    const msg = new Message(iso8859_text);
    msg.decode();

    expect(msg.hdr_idx["message-id"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]);
    expect(msg.hdr_idx["mime-version"][0].parsed);
    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");

    expect(msg.decoded).toEqual(`Wikipedia è un'enciclopedia online, libera e collaborativa.\r\n`);
  });

  it("text/plain; charset=ISO-8859-1, quoted-printable", () => {
    const msg_text = Buffer.from(
      dedent`
        Message-ID: <whatever@example.com>
        Date: Mon, 10 Jan 2022 01:59:08 -0800
        From: foo@example.com
        To: bar@example.net
        Subject: some text
        Mime-Version: 1.0
        Content-Type: text/plain; charset=ISO-8859-1
        Content-Language: it
        Content-Transfer-Encoding: quoted-printable

        Wikipedia =E8 un'enciclopedia online, libera e collaborativa.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings
    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["message-id"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);
    expect(msg.hdr_idx["subject"][0]);
    expect(msg.hdr_idx["mime-version"][0].parsed);
    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");

    expect(msg.decoded).toEqual(`Wikipedia è un'enciclopedia online, libera e collaborativa.\r\n`);
  });

  it("application/tlsrpt+gzip in base64", () => {
    const msg_text = Buffer.from(
      dedent`
        Received: from mail-qt1-f200.google.com (mail-qt1-f200.google.com [209.85.160.200])
        	by digilicious.com with ESMTPS id 84qadmkj6w196
        	for <postmaster-smtp-rua@digilicious.com>
        	(version=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256 verified);
        	Mon, 10 Jan 2022 01:59:10 -0800
        Received: by mail-qt1-f200.google.com with SMTP id m15-20020aed27cf000000b002c3def3eefdso10368059qtg.21
                for <postmaster-smtp-rua@digilicious.com>; Mon, 10 Jan 2022 01:59:10 -0800 (PST)
        MIME-Version: 1.0
        Date: Mon, 10 Jan 2022 01:59:08 -0800
        Message-ID: <000000000000447d9005d537639c@google.com>
        Subject: Report Domain: digilicious.com Submitter: google.com Report-ID: <2022.01.09T00.00.00Z+digilicious.com@google.com>
        From: noreply-smtp-tls-reporting@google.com
        To: postmaster-smtp-rua@digilicious.com
        Content-Type: multipart/report; boundary="000000000000447d8005d537639b"; report-type=tlsrpt

        --000000000000447d8005d537639b
        Content-Type: text/plain; charset="UTF-8"; format=flowed; delsp=yes

        This is an aggregate TLS report from google.com

        --000000000000447d8005d537639b
        Content-Type: application/tlsrpt+gzip; 
        	name="google.com!digilicious.com!1641686400!1641772799!001.json.gz"
        Content-Disposition: attachment; 
        	filename="google.com!digilicious.com!1641686400!1641772799!001.json.gz"
        Content-Transfer-Encoding: base64

        H4sIAAAAAAAAAHVRwW7CMAz9lSpngkI3DuS028QZTmwIWWmIIjVxFbsIhvrvc1u2AxKSpdjPz3kv
        zl1hCZDjD3DErDMkr6z6RAytr7bZLdVCNcBeF8hBWndFDIX1iHGcyLWpa21W2mz2xtgpDjLlc/OC
        Vb/Z9UbioIaFcpgZHOuYzyg0StxpbkkX32HhmMNHmMwsHSa5dYZ1bF4In5oYYhtdxJ4eIx2OtSdl
        v+5zcRvfMWeab91oj5j+qDdNXERY+OriC8lebLXb7y6r7yKchI23lRe7xfkZgesJgoD1+2pTGzOD
        V1s9eRH8+K/RYIKYRfnZsOyE+pSgTC4ZGVpNvXOe6NxLKuf4Uw77zMquFw/KGWLbF//cN8NwHH4B
        T5yRueUBAAA=
        --000000000000447d8005d537639b--
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    expect(msg.hdr_idx["received"][0].parsed);
    expect(msg.hdr_idx["received"][1].parsed);

    expect(msg.hdr_idx["mime-version"][0].parsed);
    expect(msg.hdr_idx["date"][0].parsed);
    expect(msg.hdr_idx["message-id"][0].parsed);
    expect(msg.hdr_idx["subject"][0]);
    expect(msg.hdr_idx["from"][0].parsed);
    expect(msg.hdr_idx["to"][0].parsed);

    expect(msg.hdr_idx["content-type"][0].parsed.type).toEqual("multipart");
    expect(msg.hdr_idx["content-type"][0].parsed.subtype).toEqual("report");

    expect(msg.parts.length).toEqual(2);

    expect(msg.parts[0].hdr_idx["content-type"][0].parsed.type).toEqual("text");
    expect(msg.parts[0].hdr_idx["content-type"][0].parsed.subtype).toEqual("plain");
    expect(msg.parts[0].decoded).toEqual(`This is an aggregate TLS report from google.com\r\n`);

    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.type).toEqual("application");
    expect(msg.parts[1].hdr_idx["content-type"][0].parsed.subtype).toEqual("tlsrpt+gzip");
    expect(Buffer.isBuffer(msg.parts[1].decoded));

    const report = JSON.parse(zlib.gunzipSync(msg.parts[1].decoded).toString());

    expect(report["organization-name"]).toEqual("Google Inc.");
  });
});
