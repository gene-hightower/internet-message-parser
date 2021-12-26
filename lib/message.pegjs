// 6.1  Core Rules
// <https://datatracker.ietf.org/doc/html/rfc2234#section-6.1>

ALPHA           = [A-Za-z]

CR              = "\r"

CRLF            = "\r"? "\n"

DIGIT           = [0-9]

DQUOTE          = "\""

HEXDIG          = DIGIT / [A-Fa-f]

LF              = "\n"

VCHAR           = [\x21-\x7E]

// 3.2.1. Primitive Tokens
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.1>

NO_WS_CTL       = [\x01-\x08\x0B\x0C\x0E-\x1F\x7F]
                  // not \0, \t, \n, or \r (0, 9, A, or D)

text            = [\x01-\x09\x0B\x0C\x0E-\x7F]

// 3.2.2. Quoted characters
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.2>

quoted_pair     = "\\" text / obs_qp

// 3.2.3. Folding white space and comments
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.3>

WSP             = " " / "\t"

FWS             = ((WSP* CRLF)? WSP+) / obs_FWS

ctext           = NO_WS_CTL / [\x21-\x27\x2A-\x5B\x5D-\x7E]

ccontent        = ctext / quoted_pair / comment

comment         = "(" (FWS? ccontent)* FWS? ")"

CFWS            = (FWS? comment)* ((FWS? comment) / FWS)

// 3.2.4. Atom
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.4>

atext           = ALPHA / DIGIT /
                  "!" / "#" /
                  "$" / "%" /
                  "&" / "'" /
                  "*" / "+" /
                  "-" / "/" /
                  "=" / "?" /
                  "^" / "_" /
                  "`" / "{" /
                  "|" / "}" /
                  "~"

atom            = CFWS? atext+ CFWS?

dot_atom        = CFWS? dot_atom_text CFWS?

dot_atom_text   = atext+ ("." atext+)*

// 3.2.5. Quoted strings
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.5>

qtext           = NO_WS_CTL /           // Non white space controls
                  [\x21] /              // The rest of the US-ASCII
                  [\x23-\x5B] /         //  characters not including "\"
                  [\x5D-\x7E]           //  or the quote character

qcontent        = qtext / quoted_pair

quoted_string   = CFWS?
                  DQUOTE (FWS? qcontent)* FWS? DQUOTE
                  CFWS?

// 3.2.6. Miscellaneous tokens
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.2.6>

word            = atom / quoted_string

phrase          = word+ / obs_phrase

utext           = NO_WS_CTL /           // Non white space controls
                  [\x21-\x7E]           // The rest of US-ASCII
                  / obs_utext

unstructured    = ((FWS? utext)* FWS?) / obs_unstruct

// 3.3. Date and Time Specification
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.3>

date_time       = (day_of_week ",")? date FWS time CFWS?

day_of_week     = FWS? day_name / obs_day_of_week

day_name        = "Mon"i / "Tue"i / "Wed"i / "Thu"i /
                  "Fri"i / "Sat"i / "Sun"i

date            = day month year

day             = (FWS? DIGIT? DIGIT) / obs_day

month           = "Jan"i / "Feb"i / "Mar"i / "Apr"i /
                  "May"i / "Jun"i / "Jul"i / "Aug"i /
                  "Sep"i / "Oct"i / "Nov"i / "Dec"i

year            = (DIGIT DIGIT DIGIT DIGIT) / obs_year

time            = time_of_day FWS zone

time_of_day     = hour ":" minute ( ":" second )?

hour            = (DIGIT DIGIT) / obs_hour

minute          = (DIGIT DIGIT) / obs_minute

second          = (DIGIT DIGIT) / obs_second

zone            = (FWS ( "+" / "-" ) DIGIT DIGIT DIGIT DIGIT) / obs_zone

// 3.4. Address Specification
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.4>

address         = mailbox / group

mailbox         = name_addr / addr_spec

name_addr       = display_name? angle_addr

angle_addr      = (CFWS? "<" addr_spec ">" CFWS?) / obs_angle_addr

group           = display_name ":" (mailbox_list / CFWS)? ";"
                  CFWS?

display_name    = phrase

mailbox_list    = (mailbox ("," mailbox)*) / obs_mbox_list

address_list    = (address ("," address)*) / obs_addr_list

// 3.4.1. Addr-spec specification
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.4.1>

addr_spec       = local_part "@" domain

local_part      = dot_atom / quoted_string / obs_local_part

domain          = dot_atom / domain_literal / obs_domain

domain_literal  = CFWS? "[" (FWS? dcontent)* FWS? "]" CFWS?

dcontent        = dtext / quoted_pair

dtext           = NO_WS_CTL /     // Non white space controls
                  [\x21-\X5A] /   // The rest of the US-ASCII
                  [\x5e-\x7E]     //  characters not including "[",
                                  //  "]", or "\"

// 3.5 Overall message syntax
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.5>

message         = fields / obs_fields

//                (CRLF body)?

//body          = (text* CRLF)* text*

// 3.6. Field definitions
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6>

fields          = (return /             // trace
                  received /
                  resent_date           // resent
                  resent_from /
                  resent_sender /
                  resent_to /
                  resent_cc /
                  resent_bcc /
                  resent_msg_id /
                  orig_date /           // origination
                  from /                // originator
                  sender /
                  reply_to /
                  to /                  // destination
                  cc /
                  bcc /
                  message_id /          // identification
                  in_reply_to /
                  references /          // informational
                  subject /
                  comments /
                  keywords /
                  version /             // MIME headers
                  content /
                  encoding /
                  id /
                  description /
                  optional_field)*

// 3.6.1. The origination date field
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.1>

orig_date       = "Date"i WSP* ":" date_time CRLF

// 3.6.2. Originator fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.2>

from            = "From"i WSP* ":" mailbox_list CRLF

sender          = "Sender"i WSP* ":" mailbox CRLF

reply_to        = "Reply-To"i WSP* ":" address_list CRLF

// 3.6.3. Destination address fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.3>

to              = "To"i WSP* ":" address_list CRLF

cc              = "Cc"i WSP* ":" address_list CRLF

bcc             = "Bcc"i WSP* ":" (address_list / CFWS?) CRLF

// 3.6.4. Identification fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.4>

message_id      = "Message-ID"i WSP* ":" msg_id CRLF

in_reply_to     = "In-Reply-To"i WSP* ":" msg_id+ CRLF

references      = "References"i WSP* ":" msg_id+ CRLF

msg_id          = CFWS? "<" id_left "@" id_right ">" CFWS?

id_left         = dot_atom_text / no_fold_quote / obs_id_left

id_right        = dot_atom_text / no_fold_literal / obs_id_right

no_fold_quote   = DQUOTE (qtext / quoted_pair)* DQUOTE

no_fold_literal = "[" (dtext / quoted_pair)* "]"

// 3.6.5. Informational fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.5>

subject         = "Subject"i WSP* ":" unstructured CRLF

comments        = "Comments"i WSP* ":" unstructured CRLF

keywords        = "Keywords"i WSP* ":" phrase ("," phrase)* CRLF

// 3.6.6. Resent fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.6>

resent_date     = "Resent-Date"i WSP* ":" date_time CRLF

resent_from     = "Resent-From"i WSP* ":" mailbox_list CRLF

resent_sender   = "Resent-Sender"i WSP* ":" mailbox CRLF

resent_to       = "Resent-To"i WSP* ":" address_list CRLF

resent_cc       = "Resent-Cc"i WSP* ":" address_list CRLF

resent_bcc      = "Resent-Bcc"i WSP* ":" (address_list / CFWS?) CRLF

resent_msg_id   = "Resent-Message-ID"i WSP* ":" msg_id CRLF

// 3.6.7. Trace fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.7>

//trace         = return?
//                received+

return          = "Return-Path"i WSP* ":" path CRLF

path            = CFWS? "<" (CFWS? / addr_spec) ">" CFWS?

received        = "Received"i WSP* ":" (received_token+ / CFWS)?
                  ";" date_time CRLF

received_token  = word / angle_addr / addr_spec / domain

// 3.6.8. Optional fields
// <https://datatracker.ietf.org/doc/html/rfc2822#section-3.6.8>

optional_field  = field_name WSP* ":" unstructured CRLF

field_name      = ftext+

ftext           = [\x21-\x39] /         // Any character except
                  [\x3B-\x7E]           //  controls, SP, and
                                        //  ":".

// ########## MIME ##########

// RFC-2045 predates the message syntax reformulation that started
// with RFC-2822 that introduced all the "obs-" forms.

// 4.  MIME-Version Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-4>

version         = "MIME-Version"i WSP* ":"
                  CFWS? DIGIT+ CFWS? "."
                  CFWS? DIGIT+ CFWS? CRLF

// 5.1.  Syntax of the Content-Type Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-5.1>

content         = "Content-Type"i WSP* ":" CFWS? type CFWS? "/" CFWS? subtype CFWS?
                  (";" parameter)* CFWS? CRLF
                  // Matching of media type and subtype
                  // is ALWAYS case-insensitive.

type            = discrete_type / composite_type

discrete_type   = "text"i / "image"i / "audio"i / "video"i /
                  "application"i / extension_token

composite_type  = "message"i / "multipart"i / extension_token

extension_token = ietf_token / x_token

ietf_token      = token

x_token         = "X-"i token

subtype         = extension_token / iana_token

iana_token      = token

parameter       = CFWS? attribute CFWS? "=" CFWS? value CFWS? CRLF

attribute       = token

value           = token / quoted_string

token           = [^\x00-\x20\(\)\<\>@,;:\\"/\[\]\?=]+
                  // 1*<any (US-ASCII) CHAR except SPACE, CTLs, or tspecials>

// tspecials    =  "(" / ")" / "<" / ">" / "@" /
//                 "," / ";" / ":" / "\" / <">
//                 "/" / "[" / "]" / "?" / "="
//                 // Must be in quoted-string,
//                 // to use within parameter values

// 6.1.  Content-Transfer-Encoding Syntax
// <https://datatracker.ietf.org/doc/html/rfc2045#section-6.1>

encoding        = "Content-Transfer-Encoding"i WSP* ":" CFWS? mechanism CFWS? CRLF

mechanism       = "7bit"i / "8bit"i / "binary"i /
                  "quoted-printable"i / "base64"i /
                  ietf_token / x_token

// 7.  Content-ID Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-7>

id              = "Content-ID"i WSP* ":" CFWS? msg_id CFWS? CRLF

// 8.  Content-Description Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-8>

description     = "Content-Description"i WSP* ":" unstructured CRLF

// ########## end of MIME portion ##########

// 4. Obsolete Syntax

// 4.1.  Miscellaneous Obsolete Tokens
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.1>

obs_NO_WS_CTL   = [\x01-\x08] /         // US-ASCII control
                  [\x0B] /              //  characters that do not
                  [\x0C] /              //  include the carriage
                  [\x0E-\x1F] /         //  return, line feed, and
                  [\x7F]                //  white space characters

obs_ctext       = obs_NO_WS_CTL

obs_qtext       = obs_NO_WS_CTL

obs_utext       = "\0" / obs_NO_WS_CTL / VCHAR

obs_qp          = "\\" ("\0" / obs_NO_WS_CTL / LF / CR)

//obs_body        = ((LF* CR* (("\0" / text)* LF* CR*)) / CRLF)*

obs_unstruct    = ( (CR* (obs_utext / FWS)+) / LF+ )* CR*

obs_phrase      = word (word / "." / CFWS)*

obs_phrase_list = (phrase / CFWS)? ("," (phrase / CFWS)?)*

// 4.2.  Obsolete Folding White Space
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.2>

obs_FWS         = WSP+ (CRLF WSP+)*

// 4.3.  Obsolete Date and Time
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.3>

obs_day_of_week = CFWS? day_name CFWS?

obs_day         = CFWS? DIGIT DIGIT CFWS?

obs_year        = CFWS? DIGIT DIGIT CFWS?

obs_hour        = CFWS? DIGIT DIGIT CFWS?

obs_minute      = CFWS? DIGIT DIGIT CFWS?

obs_second      = CFWS? DIGIT DIGIT CFWS?

obs_zone        =  "UT"i / "GMT"i /    // Universal Time
                  "EST"i / "EDT"i /    // Eastern:  - 5/ - 4
                  "CST"i / "CDT"i /    // Central:  - 6/ - 5
                  "MST"i / "MDT"i /    // Mountain: - 7/ - 6
                  "PST"i / "PDT"i /    // Pacific:  - 8/ - 7
                  [A-Ia-iK-Zk-z]       // Military zones - "A"
                                       // through "I" and "K"
                                       // through "Z", both
                                       // upper and lower case

// 4.4.  Obsolete Addressing
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.4>

obs_angle_addr  = CFWS? "<" obs_route addr_spec ">" CFWS?

obs_route       = obs_domain_list ":"

obs_domain_list = (CFWS / ",")* "@" domain
                  ("," CFWS? ("@" domain)?)*

obs_mbox_list   = (CFWS? ",")* mailbox ("," (mailbox / CFWS)?)*

obs_addr_list   = (CFWS? ",")* address ("," (address / CFWS)?)*

obs_group_list  = (CFWS? ",")+ CFWS?

obs_local_part  = word ("." word)*

obs_domain      = atom ("." atom)*

obs_dtext       = obs_NO_WS_CTL / quoted_pair

// 4.5.  Obsolete Header Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5>

obs_fields      = (obs_received
                   obs_bcc /
                   obs_in_reply_to /
                   obs_references /
                   obs_keywords /
                   obs_resent_bcc)*

// 4.5.3.  Obsolete Destination Address Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.3>

obs_bcc         = "Bcc" WSP* ":"
                  (address_list / ((CFWS? ",")* CFWS?)) CRLF

// 4.5.4.  Obsolete Identification Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.4>

obs_in_reply_to = "In-Reply-To" WSP* ":" (phrase / msg_id)* CRLF

obs_references  = "References" WSP* ":" (phrase / msg_id)* CRLF

obs_id_left     = local_part

obs_id_right    = domain

// 4.5.5.  Obsolete Informational Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.5>

obs_keywords    = "Keywords" WSP* ":" obs_phrase_list CRLF

// 4.5.6.  Obsolete Resent Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.6>

obs_resent_bcc  = "Resent-Bcc" WSP* ":"
                  (address_list / ((CFWS? ",")* CFWS?)) CRLF

// 4.5.7.  Obsolete Trace Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.7>

obs_received    = "Received"i WSP* ":" (received_token+ / CFWS)? CRLF
