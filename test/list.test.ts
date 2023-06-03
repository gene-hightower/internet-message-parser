import dedent from "ts-dedent";

import { Message, MessageType } from "../lib/Message";

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
    expect(msg.hdr_idx["list-unsubscribe"][0].parsed);
  });
});
