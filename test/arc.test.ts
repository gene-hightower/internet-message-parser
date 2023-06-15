import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

describe("RFC-8617", () => {
  it("Example ARC set from the RFC", () => {
    const msg_text = Buffer.from(
      dedent`Return-Path: <jqd@d1.example>
	Received: from example.org (example.org [208.69.40.157])
	    by gmail.example with ESMTP id d200mr22663000ykb.93.1421363207
	    for <fmartin@example.com>; Thu, 14 Jan 2015 15:02:40 -0800 (PST)
	Received: from segv.d1.example (segv.d1.example [72.52.75.15])
	    by lists.example.org (8.14.5/8.14.5) with ESMTP id t0EKaNU9010123
	    for <arc@example.org>; Thu, 14 Jan 2015 15:01:30 -0800 (PST)
	    (envelope-from jqd@d1.example)
	Received: from [2001:DB8::1A] (w-x-y-z.dsl.static.isp.example [w.x.y.z])
	    (authenticated bits=0)
	    by segv.d1.example with ESMTP id t0FN4a8O084569;
	    Thu, 14 Jan 2015 15:00:01 -0800 (PST)
	    (envelope-from jqd@d1.example)
	Received: from mail-ob0-f188.google.example
	    (mail-ob0-f188.google.example [208.69.40.157]) by
	    clochette.example.org with ESMTP id d200mr22663000ykb.93.1421363268
	    for <fmartin@example.org>; Thu, 14 Jan 2015 15:03:15 -0800 (PST)
	ARC-Seal: i=3; a=rsa-sha256; cv=pass; d=clochette.example.org; s=
	        clochette; t=12345; b=CU87XzXlNlk5X/yW4l73UvPUcP9ivwYWxyBWcVrRs7
	        +HPx3K05nJhny2fvymbReAmOA9GTH/y+k9kEc59hAKVg==
	ARC-Message-Signature: i=3; a=rsa-sha256; c=relaxed/relaxed; d=
	        clochette.example.org; h=message-id:date:from:to:subject; s=
	        clochette; t=12345; bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZY
	        LQ=; b=o71vwyLsK+Wm4cOSlirXoRwzEvi0vqIjd/2/GkYFYlSd/GGfKzkAgPqxf
	        K7ccBMP7Zjb/mpeggswHjEMS8x5NQ==
	ARC-Authentication-Results: i=3; clochette.example.org; spf=fail
	    smtp.from=jqd@d1.example; dkim=fail (512-bit key)
	    header.i=@d1.example; dmarc=fail; arc=pass (as.2.gmail.example=pass,
	    ams.2.gmail.example=pass, as.1.lists.example.org=pass,
	    ams.1.lists.example.org=fail (message has been altered))
	Authentication-Results: clochette.example.org; spf=fail
	    smtp.from=jqd@d1.example; dkim=fail (512-bit key)
	    header.i=@d1.example; dmarc=fail; arc=pass (as.2.gmail.example=pass,
	    ams.2.gmail.example=pass, as.1.lists.example.org=pass,
	    ams.1.lists.example.org=fail (message has been altered))
	ARC-Seal: i=2; a=rsa-sha256; cv=pass; d=gmail.example; s=20120806; t=
	        12345; b=Zpukh/kJL4Q7Kv391FKwTepgS56dgHIcdhhJZjsalhqkFIQQAJ4T9BE
	        8jjLXWpRNuh81yqnT1/jHn086RwezGw==
	ARC-Message-Signature: i=2; a=rsa-sha256; c=relaxed/relaxed; d=
	        gmail.example; h=message-id:date:from:to:subject; s=20120806; t=
	        12345; bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZYLQ=; b=CVoG44
	        cVZvoSs2mMig2wwqPaJ4OZS5XGMCegWqQs1wvRZJS894tJM0xO1RJLgCPsBOxdA5
	        9WSqI9s9DfyKDfWg==
	ARC-Authentication-Results: i=2; gmail.example; spf=fail
	    smtp.from=jqd@d1.example; dkim=fail (512-bit key)
	    header.i=@example.org; dmarc=fail; arc=pass
	    (as.1.lists.example.org=pass, ams.1.lists.example.org=pass)
	ARC-Seal: i=1; a=rsa-sha256; cv=none; d=lists.example.org; s=dk-lists;
	         t=12345; b=TlCCKzgk3TrAa+G77gYYO8Fxk4q/Ml0biqduZJeOYh6+0zhwQ8u/
	        lHxLi21pxu347isLSuNtvIagIvAQna9a5A==
	ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=
	        lists.example.org; h=message-id:date:from:to:subject; s=
	        dk-lists; t=12345; bh=KWSe46TZKCcDbH4klJPo+tjk5LWJnVRlP5pvjXFZYL
	        Q=; b=DsoD3n3hiwlrN1ma8IZQFgZx8EDO7Wah3hUjIEsYKuShRKYB4LwGUiKD5Y
	        yHgcIwGHhSc/4+ewYqHMWDnuFxiQ==
	ARC-Authentication-Results: i=1; lists.example.org; spf=pass
	    smtp.mfrom=jqd@d1.example; dkim=pass (512-bit key)
	    header.i=@d1.example; dmarc=pass
	DKIM-Signature: v=1; a=rsa-sha1; c=relaxed/relaxed; d=d1.example; h=
	        message-id:date:from:to:subject; s=origin2015; bh=bIxxaeIQvmOBdT
	        AitYfSNFgzPP4=; b=qKjd5fYibKXWWIcMKCgRYuo1vJ2fD+IAQPjX+uamXIGY2Q
	        0HjQ+Lq3/yHzG3JHJp6780/nKQPOWt2UDJQrJkEA==
	Message-ID: <54B84785.1060301@d1.example>
	Date: Thu, 14 Jan 2015 15:00:01 -0800
	From: John Q Doe <jqd@d1.example>
	To: arc@dmarc.example
	Subject: [List 2] Example 1

	Hey gang,
	This is a test message.
	--J.
    `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text, MessageType.part);
    msg.decode();

    const aar = msg.hdr_idx["arc-authentication-results"];
    expect(aar[0].parsed).not.toBeNull();

    expect(msg.hdr_idx["arc-message-signature"][0].parsed).not.toBeNull();
    expect(msg.hdr_idx["arc-seal"][0].parsed).not.toBeNull();

    // i=3
    expect(aar[0].parsed[2].instance).toBe(3);
    expect(aar[0].parsed[2].payload.id).toBe("clochette.example.org");

    let results = aar[0].parsed[2].payload.results;
    expect(results[0].method).toBe("spf");
    expect(results[0].result).toBe("fail");
    expect(results[0].reason).toBe(null);

    expect(results[0].prop[0].ptype).toBe("smtp");
    expect(results[0].prop[0].property).toBe("from");
    expect(results[0].prop[0].pvalue).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("fail");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].ptype).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].pvalue).toBe("@d1.example");

    expect(results[2].method).toBe("dmarc");
    expect(results[2].result).toBe("fail");
    expect(results[2].reason).toBe(null);
    expect(results[2].prop).toBe(null);

    expect(results[3].method).toBe("arc");
    expect(results[3].result).toBe("pass");
    expect(results[3].reason).toBe(null);
    expect(results[3].prop).toBe(null);

    // i=2
    expect(aar[1].parsed[2].instance).toBe(2);
    expect(aar[1].parsed[2].payload.id).toBe("gmail.example");

    results = aar[1].parsed[2].payload.results;
    expect(results[0].method).toBe("spf");
    expect(results[0].result).toBe("fail");
    expect(results[0].reason).toBe(null);
    expect(results[0].prop[0].ptype).toBe("smtp");
    expect(results[0].prop[0].property).toBe("from");
    expect(results[0].prop[0].pvalue).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("fail");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].ptype).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].pvalue).toBe("@example.org");

    expect(results[2].method).toBe("dmarc");
    expect(results[2].result).toBe("fail");
    expect(results[2].reason).toBe(null);
    expect(results[2].prop).toBe(null);

    expect(results[3].method).toBe("arc");
    expect(results[3].result).toBe("pass");
    expect(results[3].reason).toBe(null);
    expect(results[3].prop).toBe(null);

    // i=1
    expect(aar[2].parsed[2].instance).toBe(1);
    expect(aar[2].parsed[2].payload.id).toBe("lists.example.org");

    results = aar[2].parsed[2].payload.results;
    expect(results[0].method).toBe("spf");
    expect(results[0].result).toBe("pass");
    expect(results[0].reason).toBe(null);
    expect(results[0].prop[0].ptype).toBe("smtp");
    expect(results[0].prop[0].property).toBe("mfrom");
    expect(results[0].prop[0].pvalue).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("pass");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].ptype).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].pvalue).toBe("@d1.example");

    expect(results[2].method).toBe("dmarc");
    expect(results[2].result).toBe("pass");
    expect(results[2].reason).toBe(null);
    expect(results[2].prop).toBe(null);
  });

});
