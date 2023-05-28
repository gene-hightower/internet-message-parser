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
    expect(results[0].prop[0].type).toBe("smtp");
    expect(results[0].prop[0].property).toBe("from");
    expect(results[0].prop[0].value).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("fail");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].type).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].value).toBe("@d1.example");

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
    expect(results[0].prop[0].type).toBe("smtp");
    expect(results[0].prop[0].property).toBe("from");
    expect(results[0].prop[0].value).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("fail");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].type).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].value).toBe("@example.org");

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
    expect(results[0].prop[0].type).toBe("smtp");
    expect(results[0].prop[0].property).toBe("mfrom");
    expect(results[0].prop[0].value).toBe("jqd@d1.example");

    expect(results[1].method).toBe("dkim");
    expect(results[1].result).toBe("pass");
    expect(results[1].reason).toBe(null);
    expect(results[1].prop[0].type).toBe("header");
    expect(results[1].prop[0].property).toBe("i");
    expect(results[1].prop[0].value).toBe("@d1.example");

    expect(results[2].method).toBe("dmarc");
    expect(results[2].result).toBe("pass");
    expect(results[2].reason).toBe(null);
    expect(results[2].prop).toBe(null);
  });

  it("Real ARC set from MS", () => {
    const msg_text = Buffer.from(
      dedent`X-HmXmrOriginalRecipient: <rohanparikh@outlook.com>
X-MS-Exchange-EOPDirect: true
Received: from DM8PR02MB8055.namprd02.prod.outlook.com (2603:10b6:8:18::17) by
 BL0PR02MB4340.namprd02.prod.outlook.com with HTTPS; Sat, 6 May 2023 14:06:07
 +0000
ARC-Seal: i=2; a=rsa-sha256; s=arcselector9901; d=microsoft.com; cv=pass;
 b=Nn9noL9SiqMwsd3WL+J0cfqFOHcJfwBs/fnMyVj4owyCNgP/JBsMr4lHXR7iYz4FFimswEs8fasq18+P6f6wRQogPbTeIxIdtR1fSN4zHxfHSnX+a/EVFp5f2GfX+JU+Zu+pjAL3VR7F4oTIxjAHMo0Cp3GT4/DQj7mxYrh5eAWITEXJr2NlkoznXrtsngiZw/2Pp9EO97ktOEGiMk7NOV9yrmpjj3EN3O817OxbAVM1GCULD5hRM+KayFRxWeILcAaFQoMKzdkF3/CbC1BT/hiRx1vT8OAHebcaT4SjxjZY1IoFWkQBhqKlCQALYsnTQbWh5b7/UUoigZxy3Ib7bQ==
ARC-Message-Signature: i=2; a=rsa-sha256; c=relaxed/relaxed; d=microsoft.com;
 s=arcselector9901;
 h=From:Date:Subject:Message-ID:Content-Type:MIME-Version:X-MS-Exchange-AntiSpam-MessageData-ChunkCount:X-MS-Exchange-AntiSpam-MessageData-0:X-MS-Exchange-AntiSpam-MessageData-1;
 bh=DNW15e6vq9qCCSZSYRbXKvmkaRPgfoh/dYsjEqfXBAU=;
 b=DNngOLB/M2bJVl4drRIZlxgPLJFmMrIPrub5rbiZm5/dmNUaIu2nyqxUXbhfLD9FcZj3jHpuEqjuRyT0NcQnQ/34h+4eFngScN5cjeOzzU/tYk6rHizkHjnFrOCuZ6V6NdP9jsUQ64oxqol3sqZ29U71C6CjjEOE1NehYZcaEXmCL+8rfCXRjI7lipzvH3SgMezLapciTP9/teoiXrKqtwVxEtoPiZ5Y2wO7YDq6f8NqGd6YC0mg7A6rki9wocCs2aX66gAhZO6HCSuv4NpOzbxp+GkBLb3S6yYybChOSDz5GhJtWIpvh8SPzuIUu02QPD+LbsAGqCpZgr2LCRD8eA==
ARC-Authentication-Results: i=2; mx.microsoft.com 1; spf=pass (sender ip is
 20.67.223.11) smtp.rcpttodomain=outlook.com smtp.mailfrom=duck.com;
 dmarc=pass (p=quarantine sp=quarantine pct=100) action=none
 header.from=duck.com; dkim=pass (signature was verified) header.d=duck.com;
 arc=pass (0 oda=0 ltdi=0 93)
Received: from DUZPR01CA0062.eurprd01.prod.exchangelabs.com
 (2603:10a6:10:3c2::15) by DM8PR02MB8055.namprd02.prod.outlook.com
 (2603:10b6:8:18::17) with Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.6363.29; Sat, 6 May
 2023 14:06:06 +0000
Received: from DB5EUR02FT053.eop-EUR02.prod.protection.outlook.com
 (2603:10a6:10:3c2:cafe::89) by DUZPR01CA0062.outlook.office365.com
 (2603:10a6:10:3c2::15) with Microsoft SMTP Server (version=TLS1_2,
 cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id 15.20.6363.29 via Frontend
 Transport; Sat, 6 May 2023 14:06:06 +0000
Authentication-Results: spf=pass (sender IP is 20.67.223.11)
 smtp.mailfrom=duck.com; dkim=pass (signature was verified)
 header.d=duck.com;dmarc=pass action=none header.from=duck.com;compauth=pass
 reason=100
Received-SPF: Pass (protection.outlook.com: domain of duck.com designates
 20.67.223.11 as permitted sender) receiver=protection.outlook.com;
 client-ip=20.67.223.11; helo=smtp-outbound5.duck.com; pr=C
Received: from smtp-outbound5.duck.com (20.67.223.11) by
 DB5EUR02FT053.mail.protection.outlook.com (10.13.58.149) with Microsoft SMTP
 Server (version=TLS1_2, cipher=TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384) id
 15.20.6387.12 via Frontend Transport; Sat, 6 May 2023 14:06:06 +0000
X-IncomingTopHeaderMarker:
 OriginalChecksum:E857DB498AC0E6A320CD880DCDC8225678CB77651B1B449258A51D09932A2704;UpperCasedChecksum:F0D072521AFC660280D62310606BC48B0AAB4862933FBF07BAEB441E00076475;SizeAsReceived:3033;Count:25
Received: from [103.189.197.68] ([103.189.197.68])
	by smtp-inbound1.duck.com (Haraka/2.8.28) with ESMTP id 3F0B3EE5-713F-40DD-BB65-1846255BA8F2.1
	envelope-from <david1224@avantel.com.mx>;
	Sat, 06 May 2023 10:06:05 -0400
Subject: Re:Buy Viagra,Cialis,Levitra
Date: 7 May 2023 02:34:50 +0600
Content-Type: text/plain;
	charset="iso-8859-1"
Content-Transfer-Encoding: 7bit
X-Mailer: Microsoft Windows Live Mail 16.4.3505.912
X-MimeOLE: Produced By Microsoft MimeOLE V16.4.3505.912
Received-SPF: none (eun-prod-email-smtp5.duckduckgo.com: avantel.com.mx does not designate permitted sender hosts) client-ip=103.189.197.68;
Authentication-Results-Original: eun-prod-email-smtp5.duckduckgo.com;
 dkim=none (message not signed); spf=none
 (eun-prod-email-smtp5.duckduckgo.com: avantel.com.mx does not designate
 permitted sender hosts) smtp.mailfrom=david1224@avantel.com.mx
 smtp.helo="[103.189.197.68]"; dmarc=none header.from=avantel.com.mx;
 bimi=skipped (DMARC not enabled)
Duck-Original-From: "galven jaikumar" <david1224@avantel.com.mx>
From: galven jaikumar <david1224_at_avantel.com.mx_duckman@duck.com>
Duck-Original-To: <duckman@duck.com>
To: duckman@duck.com
Duck-Original-Message-ID: <19426E3BE63517B3E8C4914C9FBD1942@FKEQGY4>
Message-ID: <3F0B3EE5-713F-40DD-BB65-1846255BA8F2.1@smtp-inbound1.duck.com>
Duck-Original-References:
References: <19426E3BE63517B3E8C4914C9FBD1942@FKEQGY4>
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=duck.com;
 h=References: Message-ID: To: From: Content-Transfer-Encoding:
 Content-Type: MIME-Version: Date: Subject; q=dns/txt; s=postal-KpyQVw;
 t=1683381966; bh=DNW15e6vq9qCCSZSYRbXKvmkaRPgfoh/dYsjEqfXBAU=;
 b=i2YNRD/dqG8U+es6Wm7ooChItwNkqhzvXkJrm74VB/OH+4t21XwcSUsmbH7BB+Db8+sqvFfbi
 GlPWod4Bl7/nQP/mNggMwaiThvUOWbK2PVotwYKJjZkW2X41RsME1xaAycRrb4kKF+uRAkUswSi
 fQup6htrPR1e3QMxzaTEbb0=
ARC-Seal: i=1; a=rsa-sha256; t=1683381966; cv=none; d=duck.com;
 s=postal-KpyQVw;
 b=CnXT9mwAziNKOn20GTu3amEJF7Gqi9uBW2AvYwlgb03yPmvLDrQaqGyMo+vgORRIvD6yEMbxh
 uWu8Ne2Q2Nth5mwlWZFum5LjJBmnq2hXGQastArzx9SudoSQXsjgv0WFpY+T6QeXFmVDQr7Ub6r
 H9EVVi/6lXOY69AQnbYkLuc=
ARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=duck.com;
 h=References: Message-ID: To: From: Content-Transfer-Encoding:
 Content-Type: MIME-Version: Date: Subject; q=dns/txt; s=postal-KpyQVw;
 t=1683381966; bh=DNW15e6vq9qCCSZSYRbXKvmkaRPgfoh/dYsjEqfXBAU=;
 b=DN4+JqY4gs7Mw7SOG416S422VNmPeASlw5ZX3DTZosROqnc92CQElpex4aL0yyBvKIK/IK8Wp
 S+cctLuXc0mWl4XhpOBBBisN7hxsZhYXx12opX4XsKQfetplWdBkZgyAptArYxUEVs5y+umyeE+
 85CKs7HUsAmdZ4X7rKkMMp0=
ARC-Authentication-Results: i=1; eun-prod-email-smtp5.duckduckgo.com;
 dkim=none (message not signed);
 spf=none (eun-prod-email-smtp5.duckduckgo.com: avantel.com.mx does not designate permitted sender hosts) smtp.mailfrom=david1224@avantel.com.mx
 smtp.helo="[103.189.197.68]";
 dmarc=none header.from=avantel.com.mx;
 bimi=skipped (DMARC not enabled)
X-IncomingHeaderCount: 25
Return-Path: Bounce0=36428=19483=ypk5am@duck.com
X-MS-Exchange-Organization-ExpirationStartTime: 06 May 2023 14:06:06.3935
 (UTC)
X-MS-Exchange-Organization-ExpirationStartTimeReason: OriginalSubmit
X-MS-Exchange-Organization-ExpirationInterval: 1:00:00:00.0000000
X-MS-Exchange-Organization-ExpirationIntervalReason: OriginalSubmit
X-MS-Exchange-Organization-Network-Message-Id:
 fd530512-813e-438c-a99c-08db4e3b08fd
X-EOPAttributedMessage: 0
X-EOPTenantAttributedMessage: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa:0
X-MS-Exchange-Organization-MessageDirectionality: Incoming
X-MS-PublicTrafficType: Email
X-MS-TrafficTypeDiagnostic:
 DB5EUR02FT053:EE_|DM8PR02MB8055:EE_|BL0PR02MB4340:EE_
X-MS-Exchange-Organization-AuthSource:
 DB5EUR02FT053.eop-EUR02.prod.protection.outlook.com
X-MS-Exchange-Organization-AuthAs: Anonymous
X-MS-UserLastLogonTime: 5/6/2023 1:43:00 PM
X-MS-Office365-Filtering-Correlation-Id: fd530512-813e-438c-a99c-08db4e3b08fd
X-MS-Exchange-EOPDirect: true
X-Sender-IP: 20.67.223.11
X-SID-PRA: DAVID1224_AT_AVANTEL.COM.MX_DUCKMAN@DUCK.COM
X-SID-Result: PASS
X-MS-Exchange-AtpMessageProperties: SA|SL
X-MS-Exchange-Organization-SCL: 1
X-Microsoft-Antispam: BCL:0;
X-MS-Exchange-CrossTenant-OriginalArrivalTime: 06 May 2023 14:06:06.3623
 (UTC)
X-MS-Exchange-CrossTenant-Network-Message-Id: fd530512-813e-438c-a99c-08db4e3b08fd
X-MS-Exchange-CrossTenant-Id: 84df9e7f-e9f6-40af-b435-aaaaaaaaaaaa
X-MS-Exchange-CrossTenant-AuthSource:
 DB5EUR02FT053.eop-EUR02.prod.protection.outlook.com
X-MS-Exchange-CrossTenant-AuthAs: Anonymous
X-MS-Exchange-CrossTenant-FromEntityHeader: Internet
X-MS-Exchange-CrossTenant-RMS-PersistedConsumerOrg:
 00000000-0000-0000-0000-000000000000
X-MS-Exchange-Transport-CrossTenantHeadersStamped: DM8PR02MB8055
X-MS-Exchange-Transport-EndToEndLatency: 00:00:01.2443420
X-MS-Exchange-Processed-By-BccFoldering: 15.20.6363.026
X-Microsoft-Antispam-Mailbox-Delivery:
 abwl:0;wl:0;pcwl:0;kl:0;dwl:0;dkl:0;rwl:0;ucf:0;jmr:0;ex:0;auth:1;dest:I;ENG:(5062000305)(90000117)(90005022)(91005020)(91035115)(9050020)(9100338)(2008001134)(2008121020)(4810010)(4910033)(8820095)(10010002)(9910022)(9610025)(9510006)(10110021)(9320005);
X-Message-Info:
 qZelhIiYnPkx84CNH6AeQs2r1mfbx475RiI5K0+Xb2fvrntBfTJ10N2zNIvcvtf7VgXmo/rIiDTiX9S4qaHZB/x7vGYi+20jHvRBv5kS27O7FHDEwY9E9qYduSWKdNrvkUqpBmNZ7QnWK2BUjHrUIA==
X-Message-Delivery: Vj0xLjE7dXM9MDtsPTA7YT0wO0Q9MTtHRD0xO1NDTD0tMQ==
X-Microsoft-Antispam-Message-Info:
 =?us-ascii?Q?+sA3W0Hqozf7hIiYnnp3LtitSmLp2l/lci0gqTMnhcb/n+c3gVffBuHaVjph?=
 =?us-ascii?Q?EWPQmbv5MXM9bLjb3Opz/+fkG5Ota+kGbHuPp/8dOUJFv+n+LdnopSA2Fngr?=
 =?us-ascii?Q?Lf/2I+9rXEqY2pv5vdIH4aFIlLtl/Hx3c3XmwCbO0XgDD8tddHVMRE64vGbZ?=
 =?us-ascii?Q?p11oj0H+R5rCxgmL/HLQP74GU7x9gLHI0ItI2gXA0qAlUmNP1h52nZwfNcsg?=
 =?us-ascii?Q?U19sbGxDH/vSR24KCeXVONb2gMG+3li7fAF8plvDU5R1KkthTK13NZGXkNqV?=
 =?us-ascii?Q?T4A0YApXAAUbRRIfFbdT1Bs2Vp5N0exhZFANs/3FzkST/AtNQq6lEqdY6+LX?=
 =?us-ascii?Q?xVe0w9TzNRbRJYEdBVx86+28InXad8C0i7JwdANlQUiWo2Azjc/qXMxXk3Re?=
 =?us-ascii?Q?AybC9wdnK/CyM5821bzm6ZEiNOC9/SBZDHly1OHZFk09WQM9D8M5NXwk0XXm?=
 =?us-ascii?Q?tYUbOpAioN0NCQCx0wh116rj0fxy7TngJSYTMGB6mWNR7j0tOdHjtjKO/lB5?=
 =?us-ascii?Q?i9aqdbNFm6/sACEH9fi/zS6hnUcosofZ9jlzxeHc+slU/PGwy5MFnER3qZog?=
 =?us-ascii?Q?TsxAroDd4R8JuaaA2nEShKGUodtP6nSPyr5uKkwetkO/N0Ui23cB6u/DOsQz?=
 =?us-ascii?Q?QwB6YJLfz3BnyIQqjXMOn3Qbw6nnRr6ghizRNYusQ6w2bQsVvx9XseedvWIe?=
 =?us-ascii?Q?XePXz0XudB/STR9Lch+F7YNF6tD3LW+vUogvaBqdWZzooBaxo1DzdtRdVtFL?=
 =?us-ascii?Q?9CF7xY4ra4mFqf1eiXYuRHKwk1rROTz7BTzW4tGTI/WZBnrIIAUAEXXSiS2L?=
 =?us-ascii?Q?6c+sto8ObU7J4dhtbcYER5o2/j4owuUhnl5xpOu9faBslOCSxd/AmYRbmYO3?=
 =?us-ascii?Q?39qkkEi8i7OsKi/fd3fzyU7zvEx+/viUqBrwCaT2J+csPYA1TS/6WgR//2HE?=
 =?us-ascii?Q?egdmHE0I73wr+90uxB314M6QaY8RcLhls11OsscXYwKeYc8zKvgoag/fqe1d?=
 =?us-ascii?Q?+NsBOyjk+7J/T6O83juVzM/X86lCj4dWd5cmLNKgKxMGT+bhIZL14DYT2poZ?=
 =?us-ascii?Q?OjxyPSuKTgUyRQG/n3DiUFzebr6mNt4AYiPa/jpb38NqDyldqSbNyKffcbh1?=
 =?us-ascii?Q?6oe+92JHY3AmVdoBw+7xLcPaYlctWGiZI9CW+K65zC7ckl90ldaiXMD3qh8W?=
 =?us-ascii?Q?cmqWJOknBQAkvvo+k7jhGy829Q0ZLsfx7JiqSalhfHMaGrrxZsv048H4mKM9?=
 =?us-ascii?Q?NKnADQsxGlypt/Z08W6zU0q/JqK3iYaCLdHP0UjxTh82n7ux9s2fRwF7ZoBh?=
 =?us-ascii?Q?UUgN1vt2RDpCrh7RfU9pjHyXnNGoSdmz6zwLorj2jabbnx1KnbA4nClItErm?=
 =?us-ascii?Q?YoZmBNtNc6wMF4C0gyBqUvilfkxgtxg5mMn3GcgEIkLdXgUQKgPzsRgakh3A?=
 =?us-ascii?Q?g4UksISRpO9tETiv17/TQECE8Y82lebXHZx8zAcDb83hOMEW8hi0/PwobgJJ?=
 =?us-ascii?Q?Iqm0LNlCHeOFBSUSkFJLce8/FJdmRLX67YhZyH1alq5PG1qS80CcLcJsLxGW?=
 =?us-ascii?Q?Twd0iuCX5+t4VA1bKc0HhK7pOT33azb6HCwlRrMQ9+B1/gAUiXeYoW2vQMQs?=
 =?us-ascii?Q?PQzi549mK/+OeaxZ9tZIjdYxYK0cJeY4WdY1rEFHsAZPYkS0l3qS3zN0ntSU?=
 =?us-ascii?Q?vHxwgTM7vbhgA2DEojHxUpTQtOyaVD/vW5xuowZsLqX2kWIuzRdlDNQ33q/w?=
 =?us-ascii?Q?zl+/7Bvmg+xKd9pXw9lzZzIsjBq2MqCvEMB/w2BQlXwc277Tywziq/3fl2N7?=
 =?us-ascii?Q?Jhr31pVRj0o80GbZM5Ay6XvLA3ukeFFQSFs=3D?=
MIME-Version: 1.0

https://na01.safelinks.protection.outlook.com/?url=https%3A%2F%2Ftrue-pills.com%2F%3Faff%3D1087&data=05%7C01%7C%7Cfd530512813e438ca99c08db4e3b08fd%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C638189787679347464%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=XBDKEjnUi91etsf6xf5K6ksoZQegh9SDkoh7%2BuXkx08%3D&reserved=0


--_002_JMRfd530512813e438ca99c08db4e3b08fdJunk6381898476150551_--`.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text, MessageType.part);
    msg.decode();

    const aar = msg.hdr_idx["arc-authentication-results"];

    expect(aar[0].parsed).not.toBeNull();
    expect(msg.hdr_idx["arc-message-signature"][0].parsed).not.toBeNull();
    expect(msg.hdr_idx["arc-seal"][0].parsed).not.toBeNull();

    expect(aar[1].parsed).not.toBeNull();
    expect(msg.hdr_idx["arc-message-signature"][1].parsed).not.toBeNull();
    expect(msg.hdr_idx["arc-seal"][1].parsed).not.toBeNull();

    let results = aar[0].parsed[2].payload.results;

    // console.log(aar);
    // console.log(results);
  });
});
