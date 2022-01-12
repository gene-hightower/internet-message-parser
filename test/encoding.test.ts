import dedent from "ts-dedent";

import { Message, is_structured_header } from "../lib/Message";

const zlib = require("zlib");

describe("Content-Type: encodings", () => {
  it("base64", () => {
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
