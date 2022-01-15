/* Test from mailparser.
 */

import dedent from "ts-dedent";

import { Message } from "../lib/Message";

describe("Simple with part as rfc822 with bad closing boundary", () => {
  it("01", () => {
    const encodedText = dedent`Delivered-To: xxxx@gmail.com
        Date: Wed, 03 Jun 2020 22:50:46 GMT
        From: "cPanel on vps17201.sdfsfsd.com" <cpanel@sdfdsfs.sdfsdffs.com>
        Message-Id: <sdfsdfs.v8A6D9BhtMalmPG8@vps17201.inmotionhosting.com>
        Subject: [vps17201.sfsfsdfds.com] cPanel & WHM update failure in upcp script
        To: <sfsdfsfsd@gmail.com>
        Mime-Version: 1.0
        Content-Type: multipart/mixed; boundary="mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088"

        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088
        Content-Type: multipart/alternative; boundary="alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971"

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971
        Content-Type: text/plain; charset=utf-8
        Content-Transfer-Encoding: quoted-printable

        Test

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971
        Content-Type: multipart/related; boundary="related-Cpanel::Email::Object-28634-1591224646-0.29282857359793"

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793
        Content-Type: text/html; charset=utf-8
        Content-Transfer-Encoding: quoted-printable

        <body></body>

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793--

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971--

        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088
        Content-Type: text/plain; charset="utf-8"; x-unix-mode=0600; name="update_log.txt"
        Content-Disposition: attachment; filename="update_log.txt"
        Content-Transfer-Encoding: base64

        Z2xvcA==
        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088
`.replace(/\n/g, "\r\n");

    const mail = Buffer.from(encodedText, "utf-8");

    try {
      const mailparser = new Message(mail);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual(
        "no close-delimiter (--mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088--) found"
      );
      return;
    }

    fail("expecting excpetion");
  });

  it("02", () => {
    const encodedText = dedent`Delivered-To: xxxx@gmail.com
        Date: Wed, 03 Jun 2020 22:50:46 GMT
        From: "cPanel on vps17201.sdfsfsd.com" <cpanel@sdfdsfs.sdfsdffs.com>
        Message-Id: <sdfsdfs.v8A6D9BhtMalmPG8@vps17201.inmotionhosting.com>
        Subject: [vps17201.sfsfsdfds.com] cPanel & WHM update failure in upcp script
        To: <sfsdfsfsd@gmail.com>
        Mime-Version: 1.0
        Content-Type: multipart/mixed; boundary="mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088"

        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088
        Content-Type: multipart/alternative; boundary="alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971"

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971
        Content-Type: text/plain; charset=utf-8
        Content-Transfer-Encoding: quoted-printable

        Test

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971
        Content-Type: multipart/related; boundary="related-Cpanel::Email::Object-28634-1591224646-0.29282857359793"

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793
        Content-Type: text/html; charset=utf-8
        Content-Transfer-Encoding: quoted-printable

        <body></body>

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793

        --related-Cpanel::Email::Object-28634-1591224646-0.29282857359793--

        --alternative-Cpanel::Email::Object-28634-1591224646-0.846610436809971--
        
        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088
        Content-Type: text/plain; charset="utf-8"; x-unix-mode=0600; name="update_log.txt"
        Content-Disposition: attachment; filename="update_log.txt"
        Content-Transfer-Encoding: base64

        Z2xvcA==
        --mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088`.replace(/\n/g, "\r\n");

    const mail = Buffer.from(encodedText, "utf-8");

    try {
      const mailparser = new Message(mail);
    } catch (e) {
      const ex = e as Error;
      expect(ex.message).toEqual(
        "no close-delimiter (--mixed-Cpanel::Email::Object-28634-1591224646-0.368578683442088--) found"
      );
      return;
    }

    fail("expecting excpetion");
  });
});
