import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";
import { URL } from "url";

describe("List Commands RFC-2369 ", () => {
  it("Simple parse test", () => {
    const msg_text = Buffer.from(
      dedent`List-Help: <mailto:list@host.com?subject=help> (List Instructions)
             List-Help: <mailto:list-manager@host.com?body=info>
             List-Help: <mailto:list-info@host.com> (Info about the list)
             List-Help: <http://www.host.com/list/>, <mailto:list-info@host.com>
             List-Help: <ftp://ftp.host.com/list.txt> (FTP),
                 <mailto:list@host.com?subject=help>
             List-Unsubscribe: <mailto:list@host.com?subject=unsubscribe>
             List-Unsubscribe: (Use this command to get off the list)
                  <mailto:list-manager@host.com?body=unsubscribe%20list>
             List-Unsubscribe: <mailto:list-off@host.com>
             List-Unsubscribe: <http://www.host.com/list.cgi?cmd=unsub&lst=list>,
                 <mailto:list-request@host.com?subject=unsubscribe>
       `.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text, MessageType.part);
    const lu_hdrs = msg.hdr_idx["list-unsubscribe"];
    for (const lu_hdr of lu_hdrs) {
      expect(lu_hdr.parsed).not.toBeNull();
    }
  });

  it("cio.com", () => {
    const msg_text = Buffer.from(
      dedent`Return-Path: <mail.fskulktmheyrvinqxnzui@edt.cio.com>
             Received-SPF: pass (digilicious.com: domain of edt.cio.com designates 185.187.116.241 as permitted sender) client-ip=185.187.116.241; envelope-from=mail.fskulktmheyrvinqxnzui@edt.cio.com; helo=mail116-241.us2.msgfocus.com;
             Received: from mail116-241.us2.msgfocus.com (mail116-241.us2.msgfocus.com [185.187.116.241])
             	by digilicious.com with ESMTPS id enb7y4asjppo1
             	for <infoworld@digilicious.com>
             	(version=TLSv1.3 cipher=TLS_AES_256_GCM_SHA384 bits=256/256);
             	Tue, 13 Jun 2023 11:17:39 -0700
             DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; s=msgf; d=msgfocus.com;
              h=Subject:Message-ID:Reply-To:To:List-Unsubscribe:From:Date:MIME-Version:
              Content-Type;
              bh=X8ixxyvyilg1x+KsBZzmiOTbF77SfzM8IKBQr7mjcK4=;
              b=anL4eCNdc4vq+JoUeuI1sz4AwpGh5RAQKbESSVObK+c9tIg/zcKL7EN8ArhcIHmHmXURIZGaVHm+
                6Qv1fpIV0iLjEsaQBm+DwCSVwl8RW+LtFnJMK9VkB14gU/AWVvt+0bZ6PljNP+OGoSKfS4FD+Fbd
                mtfYJYAxc5BV8z/cqAk=
             DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=edt.cio.com; s=msgf; t=1686680243;
             	bh=X8ixxyvyilg1x+KsBZzmiOTbF77SfzM8IKBQr7mjcK4=;
             	h=Subject:Message-ID:Reply-To:To:List-Unsubscribe:From:Date:
             	 MIME-Version:Content-Type;
             	b=YszBuwTjGVo4e3s9xi+GqtCXg5FSEsAJo85iO7ROAU1GuOC3Qvnuj+epXkYlJ+O/x
             	 0u2bHHLsEqh43cGxlEoNjbDb1PFFInY3TehjU77exVsCjnBcxRmjUAj1u4/5j4HbTy
             	 t/fBnrD27bP42P+T8jyFiaLdbYg1xFANd6l62XR0=
             Subject: CIO 100 Symposium & Awards: Take your seat at the CIO Masterclass
             Message-ID: <8kI01-7iwwzj4rc-2gke-1uDWVcsoHDzZQHubMg@edt.cio.com>
             Reply-To: CIO Events <mail.fskulktmheyrvinqxnzui@edt.cio.com>
             To: infoworld@digilicious.com
             List-Unsubscribe:
             	<mailto:mail.fskulktmheyrvinqxnzui@edt.cio.com?subject=Unsubscribe>, <https://foo.bar.baz/zzz-aaa>, <file:///tmp>
             List-Unsubscribe: <mailto:unsubscribe@example.com?subject=unsubscribe:x-y~|a{b}c>
             From: CIO Events <events@edt.cio.com>
             Date: Tue, 13 Jun 2023 19:17:23 +0100
             MIME-Version: 1.0
             Content-Type: multipart/alternative; boundary="--128AA07B9B19950A8D18007D05225CC"
             X-Virtual-MTA: vmta116-241

             ----128AA07B9B19950A8D18007D05225CC
             Content-Type: text/plain; charset="UTF-8"
             Content-Transfer-Encoding: quoted-printable

             https://edt.cio.com/c/18CddlHsSyi34GnubMjUgfJxlTk

             https://edt.cio.com/c/1ty1rE99HL49O1dyz5QGmiuU4LHMZ

             Are you ready to take your leadership skills to the next level? Join us at =
             the CIO 100 Symposium & Awards from August 14-16, where you'll have the opp=
             ortunity to learn from award-winning CIOs.

             Come for our Leadership Masterclass at CIO 100. Don't miss this opportunity=
              to learn leadership trade secrets from the following CIOs.

             CIO Perspectives: Making a Difference Every Day

             Rob Carter, EVP, Information Services & CIO, FedEx Corporation
             Shelia Anderson, SVP & CIO, Aflac

             Developing the Future Ready Workforce: Turning Vision into Action

             Anupam Khare, SVP & CIO, Oshkosh Corporation, Inc.
             Ghada Ijam, System CIO, Federal Reserve System

             Unlocking Business Value: Digital Transformation That Goes Beyond Technology

             Michael Smith, CIO, The Est=C3=A9e Lauder Companies

             And that=E2=80=99s just the beginning. View our growing agenda here
             https://edt.cio.com/c/1ty1rJxrxbV8Bf9h1eSHitANG6279.

             https://edt.cio.com/c/1ty1rMeArUlCZR78fjoHLz8KtLche

             We encourage you to sign up early and book your resort stay. (Deadline to b=
             ook in resort room block is June 30).

             Early Preferred Pricing Offer: Register
             https://edt.cio.com/c/1ty1rOVJmCM7ot4ZtnUIeEGHhqmrj for $995.00, (includes =
             full 2.5-day conference, all sessions, and closing awards gala), a savings =
             of 50% off the standard rate.

             Attend
             https://edt.cio.com/c/1ty1rRCShlcBN52QHsqIHKeE55wBo the CIO 100 Symposium &=
              Awards to immerse yourself in the highest level of knowledge sharing. Visi=
             t =E2=80=9CWhat To Expect=E2=80=9D
             https://edt.cio.com/c/1ty1rUk1c3D6bH0HVwWJaPMASKGLt to learn more.

             Remember, we will sell out!

             Regards,

             Debra Becker
             CIO 100 Symposium & Awards

             Sponsor Partners:

             Email not displaying correctly? View it in your browser https://edt.cio.com=
             /q/12Ew1BBq45PaPAFpxHBr5wcC/wv.

             * This invitation is not a guarantee of admission. Upon online registration=
             , your application will be reviewed pending qualification and you will be p=
             romptly notified of your attendance status. Foundry *formerly IDG Communica=
             tions reserves the right to determine the qualification of individual atten=
             dees and the event's total audience profile.

             SUBSCRIPTION SERVICES =E2=80=94 You are currently subscribed as infoworld@d=
             igilicious.com.

             To unsubscribe from future emails about this event, please click here https=
             ://edt.cio.com/k/1d3mzdDphMtj4Y47O8J1v5nRA.

             To opt out of future emails about all Foundry *formerly IDG Communications =
             events, please click here https://edt.cio.com/c/1ty1sMeTuoaU7WjSsZgSyCJyU1Y=
             15.

             Please do not reply to this message. To contact someone directly, send an e=
             mail to newsletters@idg.com
             newsletters@idg.com.

             View Foundry *formerly IDG Communications privacy policy
             https://edt.cio.com/c/1ty1rX1a6M3AAiYz9BsJDVkxGpQVy.

             Copyright 2023 | Foundry *formerly IDG Communications, Inc. | 140 Kendrick =
             Street, Building B | Needham, MA 02494 | www.foundryco.com
             https://edt.cio.com/c/1ty1rZIj1uu4YUWqnFYK70Suu515D


             If you wish to unsubscribe, please click on the link below.
             Please note this is an automated operation.
             https://edt.cio.com/u/11gS6mwyzy1xLXYmJXcRPO3j

             ----128AA07B9B19950A8D18007D05225CC
             Content-Type: text/html; charset="UTF-8"
             Content-Transfer-Encoding: quoted-printable

             <!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "https://www=
             .w3.org/TR/html4/loose.dtd">
             <html lang=3D"en">
             <head>
             	<meta content=3D"initial-scale=3D1.0" name=3D"viewport" />
             	<!-- So that mobile webkit will display zoomed in -->=09=09
             	<meta content=3D"telephone=3Dno" name=3D"format-detection" />
             	<!-- disable auto telephone linking in iOS -->=09=09
             <title></title>
             </head>
             <body bgcolor=3D"#ffffff" style=3D"margin:0; padding:0;">
             <p><a href=3D"https://edt.cio.com/c/13NQaGsn0ig85EPDFQLUWj3CAbW" target=3D"=
             _blank"><img src=3D"https://edt.cio.com/t/1uDWVcsoHDzZQHubMg.png" alt=3D"">=
             </a></p>
             <table style=3D"padding-top: 30px;" border=3D"0" cellspacing=3D"0" cellpadd=
             ing=3D"0" width=3D"100%" height=3D"100%" bgcolor=3D"#ffffff">

             <tr>
             <td style=3D"background-color: #ffffff;" align=3D"center" valign=3D"top" bg=
             color=3D"#ffffff">
             <table style=3D"width: 600px; max-width: 600px;" border=3D"0" cellspacing=
             =3D"0" cellpadding=3D"0" width=3D"600">

             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 16px; li=
             ne-height: 24px; padding: 0 0 20px 0;" align=3D"left">
             <p><!-- EVENTS HTML CONTENT GOES BELOW --> <!-- EVENTS HTML CONTENT GOES AB=
             OVE --></p>
             <p>&nbsp;<a href=3D"https://edt.cio.com/c/1ty1s2prWcUznwUhBKuKA6qrhKbfI" ta=
             rget=3D"_blank"><img src=3D"https://edt.cio.com/files/amf_idg/project_449/C=
             IO_100_2023_Attendee_Recruit/email_CIO100_2023_600x200px.png" border=3D"0" =
             alt=3D""></a></p>
             <p>Are you ready to take your leadership skills to the next level? Join us =
             at the CIO 100 Symposium &amp; Awards from August 14-16, where you'll have =
             the opportunity to learn from award-winning CIOs.</p>
             <p>Come for our <b>Leadership Masterclass at CIO 100</b>. Don't miss this o=
             pportunity to learn leadership trade secrets from the following CIOs.&nbsp;=
             </p>
             <p><b>CIO Perspectives: Making a Difference Every Day</b></p>
             <ul>
             <li>Rob Carter, EVP, Information Services &amp; CIO, FedEx Corporation</li>
             <li>Shelia Anderson, SVP &amp; CIO, Aflac</li>
             </ul>
             <p><b>Developing the Future Ready Workforce: Turning Vision into Action</b>=
             </p>
             <ul>
             <li>Anupam Khare, SVP &amp; CIO, Oshkosh Corporation, Inc.</li>
             <li>Ghada Ijam, System CIO, Federal Reserve System</li>
             </ul>
             <p><b>Unlocking Business Value: Digital Transformation That Goes Beyond Tec=
             hnology</b></p>
             <ul>
             <li>Michael Smith, CIO, The Est&eacute;e Lauder Companies</li>
             </ul>
             <p>And that&rsquo;s just the beginning. View our growing agenda <b><font co=
             lor=3D"#0000ff"><a style=3D"color: #0000ff;" href=3D"https://edt.cio.com/c/=
             1ty1s56AQVl3M8S8PP0L3bYo5plpN" target=3D"_blank"><font color=3D"#0000ff">he=
             re</font></a></font></b>.</p>
             <p style=3D"text-align: center;" align=3D"center"><a href=3D"https://edt.ci=
             o.com/c/1ty1s7NJLDLyaKQ03TwLwhwkT4vzS" target=3D"_blank"><img style=3D"text=
             -align: center;" align=3D"center" src=3D"https://edt.cio.com/files/amf_idg/=
             project_449/GE/Cloud_April_2022/button_Register_CIO_red_200x50_1_.png" bord=
             er=3D"0" alt=3D""></a></p>
             <p>We encourage you to sign up early and book your resort stay. (Deadline t=
             o book in resort room block is June 30).</p>
             <p><b>Early Preferred Pricing Offer</b>: <b><a href=3D"https://edt.cio.com/=
             c/1ty1sdc1B4CwXYLIw2yMssCeuoPU2" target=3D"_blank">Register</a> for $995.00=
             </b>, (includes full 2.5-day conference, all sessions, and closing awards g=
             ala), a savings of 50% off the standard rate.</p>
             <p><b><a href=3D"https://edt.cio.com/c/1ty1sfTavN31mAJzK74MVyabi4047" targe=
             t=3D"_blank">Attend</a></b> the CIO 100 Symposium &amp; Awards to immerse y=
             ourself in the highest level of knowledge sharing. Visit <font color=3D"#00=
             00ff"><b><a style=3D"color: #0000ff;" href=3D"https://edt.cio.com/c/1ty1siA=
             jqvtvLcHqYbANoDI85Jaec" target=3D"_blank"><font color=3D"#0000ff">&ldquo;Wh=
             at To Expect&rdquo;</font></a></b></font>&nbsp;to learn more.</p>
             <p><font size=3D"4"><b>Remember, we will sell out!</b></font></p>
             <p>Regards,</p>
             <p>Debra Becker <br>CIO 100 Symposium &amp; Awards</p>
             <p>&nbsp;</p>
             <p><b>Sponsor Partners:</b></p>
             <p>&nbsp;</p>
             <p>&nbsp;<img src=3D"https://edt.cio.com/files/amf_idg/project_449/CIO_100_=
             2023_Attendee_Recruit/email_sponsor_042523_CIO100_600x400.png" border=3D"0"=
              alt=3D"" width=3D"562" height=3D"369"></p>
             <p>&nbsp;</p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0; border-top: 1px solid #=
             000000;" align=3D"left"><br>
             <p style=3D"margin: 0; font-family: Helvetica, Arial, sans-serif; font-size=
             : 13px; line-height: 18px;">Email not displaying correctly? <a href=3D"http=
             s://edt.cio.com/q/12Ew1BBq45PaPAFpxHBr5wcC/wv">View it in your browser</a>.=
             </p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left"><br>
             <p style=3D"margin: 0; font-family: Helvetica, Arial, sans-serif; font-size=
             : 13px; line-height: 18px;">* This invitation is not a guarantee of admissi=
             on. Upon online registration, your application will be reviewed pending qua=
             lification and you will be promptly notified of your attendance status. Fou=
             ndry *formerly IDG Communications reserves the right to determine the quali=
             fication of individual attendees and the event's total audience profile.</p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left"><br>
             <p style=3D"margin: 0;"><b>SUBSCRIPTION SERVICES</b> &mdash; You are curren=
             tly subscribed as infoworld@digilicious.com.<br><br></p>
             </td>
             <!--
             							<tr>
             								<td align=3D"left" style=3D"font-family: Helvetica, Arial, sans-ser=
             if; font-size: 13px; line-height: 18px; padding-left: 0; padding-right: 0;">
             									<p style=3D"margin: 0;">
             										To unsubscribe from all emails about Foundry *formerly IDG Commun=
             ications Events, please <a href=3D"https://edt.cio.com/k/1d3mzdDphMtj4Y47O8=
             J1v5nRA">click here</a>.<br /><br />
             									</p>
             								</td>
             							</tr>
             							--></tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left">
             <p style=3D"margin: 0;">To unsubscribe from future emails about this event,=
              please <a href=3D"https://edt.cio.com/k/1d3mzdDphMtj4Y47O8J1v5nRA">click h=
             ere</a>.<br><br></p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left">
             <p style=3D"margin: 0;">To opt out of future emails about all Foundry *form=
             erly IDG Communications events, please <a href=3D"https://edt.cio.com/c/1ty=
             1sOW2p6BowyhJH3MT1IhvHH8ba">click here</a>.<br><br></p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left">
             <p style=3D"margin: 0;">Please do not reply to this message. To contact som=
             eone directly, send an email to <a href=3D"mailto:newsletters@idg.com">news=
             letters@idg.com</a>.<br><br></p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0;" align=3D"left">
             <p style=3D"margin: 0;">View Foundry *formerly IDG Communications <a href=
             =3D"https://edt.cio.com/c/1ty1slhsldU09OFicg6NRJg4Tokoh" target=3D"_blank">=
             privacy policy</a>.<br><br></p>
             </td>
             </tr>
             <tr>
             <td style=3D"font-family: Helvetica, Arial, sans-serif; font-size: 13px; li=
             ne-height: 18px; padding-left: 0; padding-right: 0; padding-bottom: 10px;" =
             align=3D"left">
             <p style=3D"margin: 0;">Copyright 2023 &nbsp;|&nbsp; Foundry *formerly IDG =
             Communications, Inc. &nbsp;|&nbsp; 140 Kendrick Street, Building B &nbsp;|&=
             nbsp; Needham, MA 02494 &nbsp;|&nbsp; <a href=3D"https://edt.cio.com/c/1ty1=
             snYBfWkuyqD9qkCOkOO1H3uym" target=3D"_blank">www.foundryco.com</a><br><br><=
             /p>
             </td>
             </tr>

             </table>
             </td>
             </tr>

             </table>

             <div style=3D"background-color:white;color:gray;font-size:9pt;font-family:a=
             rial,san-serif;padding:10px 15px;margin:5px;line-height:12pt;">
             	If you wish to unsubscribe, please click on the link below.<br>
             	Please note this is an automated operation.<br>
             	<a href=3D"http://www.adestra.com/?src=3Demail"><img border=3D"0" align=3D=
             "right" src=3D"http://hosted.adestra.com/messagefocus/pb.gif" alt=3D"Powere=
             d by Adestra" width=3D"118" height=3D"17"></a>
             	<a href=3D"https://edt.cio.com/u/11gS6mwyzy1xLXYmJXcRPO3j" style=3D"color:=
             #003399">https://edt.cio.com/u/11gS6mwyzy1xLXYmJXcRPO3j</a>
             </div>


             <!--[if lt mso 12]><img src=3D"https://edt.cio.com/r/1uDWVcsoHDzZQHubMg.png=
             ?c=3D1" alt=3D""><![endif]--><![if gt mso 11]><img src=3D"https://edt.cio.c=
             om/r/1uDWVcsoHDzZQHubMg.png" alt=3D""><![endif]>
             </body>
             </html>=

             ----128AA07B9B19950A8D18007D05225CC--`.replace(/\n/g, "\r\n")
    ); // CRLF line endings

    const msg = new Message(msg_text);
    msg.decode();

    const uris = msg.hdr_idx["list-unsubscribe"][0].parsed;
    expect(uris[0]).toEqual(new URL("mailto:mail.fskulktmheyrvinqxnzui@edt.cio.com?subject=Unsubscribe"));
    expect(uris[1]).toEqual(new URL("https://foo.bar.baz/zzz-aaa"));
    expect(uris[2]).toEqual(new URL("file:///tmp"));

    const uris_1 = msg.hdr_idx["list-unsubscribe"][1].parsed;
    expect(uris_1[0]).toEqual(new URL("mailto:unsubscribe@example.com?subject=unsubscribe:x-y~|a{b}c"));
  });
});
