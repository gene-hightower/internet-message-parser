import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

describe("DKIM Signatures RFC-6376 ", () => {
  it("Simple parse test", () => {
    const msg_text = Buffer.from(`DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20161025;
        h=mime-version:reply-to:from:date:message-id:subject:to;
        bh=8RegOlJD0udPc+TogIjhWcR2b9VwF9rz0+RfjmeNupQ=;
        b=Pc26OKTY17yCPf9rqs4XYJcWtgHIla8HfGGhu9vL/br6aNm3rz9uCaa75s+5imdcL9
         tlmeFnD61EsYl7Uf+GLyQvn2G+Y6FA2TmJssse33RpHSD5hDNeXNBp9n7peByj+Rqvqm
         50NfZ3BQb6EIE/BvNoYtmc/qspPdlcKM0mHAS8XcBfnSrk62V708HRNDNaVKpSQ6fzyH
         9niRDzpV7Db89ouUx2jGXzZzAjmQmoajHUN0dD8Q7UcEdELsSSTkjHq2QR7yijW6fOEh
         Divt3vAssuiMVsvsvErsy7RPM5ImfTg8L8C38GRpDjiy7h8g2J3cQkwnrHEwWXPzaocB
         KGoQ==`.replace(/\n/g, "\r\n") + "\r\n"
    ); // CRLF line endings

    const msg = new Message(msg_text, MessageType.part);
    expect(msg.hdr_idx["dkim-signature"][0].parsed);
  });

});
