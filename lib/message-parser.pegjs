{{
import {
ARCInfo,
AuthResPayload,
ContentTransferEncoding,
ContentType,
MIMEVersion,
Parameter,
PropSpec,
ResInfo,
Result
} from "./message-types";

// The list of fields recongnized by the field rule.
export const structuredHeaders = [
  "accept-language",
  "arc-authentication-results",
  "arc-message-signature",
  "arc-seal",
  "authentication-results",
  "auto-submitted",
  "bcc",
  "cc",
  "content-disposition",
  "content-id",
  "content-language",
  "content-location",
  "content-transfer-encoding",
  "content-type",
  "date",
  "dkim-signature",
  "from",
  "in-reply-to",
  "keywords",
  "message-id",
  "mime-version",
  "received",
  "references",
  "reply-to",
  "require-recipient-valid-since",
  "resent-bcc",
  "resent-cc",
  "resent-date",
  "resent-from",
  "resent-message-id",
  "resent-sender",
  "resent-to",
  "return-path",
  "sender",
  "to",
  "x-hmxmroriginalrecipient",
];

  function extractOptional(optional: [any], index: number) {
    return optional ? optional[index] : null;
  }
}}

// 6.1  Core Rules
// <https://datatracker.ietf.org/doc/html/rfc2234#section-6.1>

ALPHA           = [A-Za-z]

CR              = "\r"

CRLF            = "\r"? "\n"    // <- This is a deviation from the
                                //    standard to accept a single newline
                                //    as a line terminator.
DIGIT           = [0-9]

DQUOTE          = ["]

HEXDIG          = DIGIT / [A-Fa-f]

LF              = "\n"

// 3.2.  Syntax Extensions to RFC 5322
// <https://datatracker.ietf.org/doc/html/rfc6532#section-3.2>

VCHAR           = [\x21-\x7E\x80-\uFFFF]

// \x80-\xFFFF should cover any UCS-2 code value

WSP             = [ \t]

// 3.2.1.  Quoted characters
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.1>

quoted_pair     = ("\\" (VCHAR / WSP)) / obs_qp

// 3.2.2.  Folding White Space and Comments
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.2>

FWS             = ((WSP* CRLF)? WSP+) / obs_FWS

ctext           = [\x21-\x27] /          // Printable US-ASCII
                  [\x2A-\x5B] /          //  characters not including
                  [\x5D-\x7E] /          //  "(", ")", or "\"
                  obs_ctext /
                  [\x80-\uFFFF]

ccontent        = ctext / quoted_pair / comment

comment         = "(" (FWS? ccontent)* FWS? ")"

CFWS            = ((FWS? comment)+ FWS?) / FWS

// 3.2.3. Atom
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.3>

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
                  "~" /
                  [\x80-\uFFFF]

atom            = CFWS? atext+ CFWS?

dot_atom_text   = atext+ ("." atext+)*

dot_atom        = CFWS? dot_atom_text CFWS?

// 3.2.4.  Quoted Strings
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.4>

qtext           = [\x21] /              // Printable US-ASCII
                  [\x23-\x5B] /         //  characters not including
                  [\x5D-\x7E] /         //  "\" or the quote character
                  obs_qtext /
                  [\x80-\uFFFF]

qcontent        = qtext / quoted_pair

quoted_string   = CFWS?
                  DQUOTE (FWS? qcontent)* FWS? DQUOTE
                  CFWS?

// 3.2.5.  Miscellaneous Tokens
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.5>

word            = atom / quoted_string

phrase          = word+ / obs_phrase

// unstructured = unstruct / obs_unstruct
// unstruct     = (FWS? VCHAR)* WSP*

// 3.3. Date and Time Specification
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.3>

date_time       = dt:((day_of_week ",")? date time) CFWS?
                  {
                    return dt.flat(99).join("");
                  }

day_of_week     = (FWS? day_name) / obs_day_of_week

day_name        = "Mon"i / "Tue"i / "Wed"i / "Thu"i /
                  "Fri"i / "Sat"i / "Sun"i

date            = day month year

day             = (FWS? DIGIT DIGIT? FWS) / obs_day

month           = "Jan"i / "Feb"i / "Mar"i / "Apr"i /
                  "May"i / "Jun"i / "Jul"i / "Aug"i /
                  "Sep"i / "Oct"i / "Nov"i / "Dec"i

year            = (FWS DIGIT DIGIT DIGIT DIGIT FWS) / obs_year

time            = time_of_day zone

// Fractional seconds added as an extension as used by sendgrid, among others.
time_of_day     = hour ":" minute ( ":" second ("." DIGIT+)? )?

hour            = (DIGIT DIGIT) / obs_hour

minute          = (DIGIT DIGIT) / obs_minute

second          = (DIGIT DIGIT) / obs_second

zone            = FWS ((( "+" / "-" ) DIGIT DIGIT DIGIT DIGIT) / obs_zone)

// 3.4. Address Specification
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4>

address         = mailbox / group

mailbox         = name_addr / addr_spec

name_addr       = display_name? (angle_addr / "<>") // <- Empty angle_addr is an extension.

angle_addr      = (CFWS? "<" addr_spec ">" CFWS?) / obs_angle_addr

group           = display_name ":" group_list? ";" CFWS?

// The display-name in common use often contains ".", "@", and ",".
//display_name    = phrase
display_name    = (word / "." / "@" / "," / CFWS)*

mailbox_list    = (mailbox ("," mailbox)*) / obs_mbox_list

address_list    = (address ("," address)*) / obs_addr_list

group_list      = mailbox_list / CFWS / obs_group_list

// 3.4.1. Addr-spec specification
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1>

addr_spec       = local_part "@" domain

local_part      = dot_atom / quoted_string / obs_local_part

domain          = dot_atom / domain_literal / obs_domain

domain_literal  = CFWS? "[" (FWS? dtext)* FWS? "]" CFWS?

dtext           = [\x21-\x5A] /         // Printable US-ASCII
                  [\x5E-\x7E] /         //  characters not including
                  obs_dtext /           //  "[", "]", or "\"
                  [\x80-\uFFFF]

// 3.5 Overall message syntax
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.5>

//message         = fields // obs_fields
//                (CRLF body)?

//   body            =   (*(*998text CRLF) *998text) / obs-body

//   text            =   %d1-9 /            ; Characters excluding CR
//                       %d11 /             ;  and LF
//                       %d12 /
//                       %d14-127 /
//                       [\x80-\u{10FFFF}]

// 3.6. Field definitions
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6>

// I don't try to enforce the field groupings, i.e. trace fields
// first, and so on.

field          =  return /              // trace
                  received /
                  resent_date /         // resent
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
                  keywords /
                  version /             // MIME headers
                  content /
                  encoding /
                  id /
                  content_language /
                  accept_language /
                  content_location /
                  obs_bcc /             // obsolete
                  obs_in_reply_to /
                  obs_references /
                  obs_keywords /
                  obs_resent_bcc /
                  obs_received /
                  authres_header_field /    // Others
                  auto_submitted_field /
                  disposition /
                  rrvs /
                  dkim_sig /
                  original_recipient /
                  arc_authres_header /  // ARC
                  arc_message_signature /
                  arc_seal

// 3.6.1. The origination date field
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.1>

orig_date       = "Date"i WSP* ":" date_time CRLF

// 3.6.2. Originator fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.2>

// <https://datatracker.ietf.org/doc/html/rfc6854#section-2>
from            = "From"i WSP* ":" list:(mailbox_list / address_list) CRLF
                  {
                    return list;
                  }

sender          = "Sender"i WSP* ":" (mailbox / address) CRLF

reply_to        = "Reply-To"i WSP* ":" address_list CRLF

// 3.6.3. Destination address fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.3>

to              = "To"i WSP* ":" address_list CRLF

//cc            = "Cc"i WSP* ":" address_list CRLF
cc              = "Cc"i WSP* ":" (address_list / CFWS?) CRLF // <- Empty Cc: is an extension.

bcc             = "Bcc"i WSP* ":" (address_list / CFWS)? CRLF

// 3.6.4. Identification fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.4>

message_id      = "Message-ID"i WSP* ":" msg_id CRLF

in_reply_to     = "In-Reply-To"i WSP* ":" msg_id+ CRLF

references      = "References"i WSP* ":" msg_id+ CRLF

// msg_id       = CFWS? "<" id_left "@" id_right ">" CFWS?
msg_id_only     = id_left "@" id_right // <- Accepting msg_id without enclosing "<>" is an extension.
msg_id          = CFWS? ("<" msg_id_only ">") / (msg_id_only) CFWS?

id_left         = dot_atom_text / obs_id_left

id_right        = dot_atom_text / no_fold_literal / obs_id_right

no_fold_literal = "[" dtext* "]"

// 3.6.5. Informational fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.5>

//subject       = "Subject"i WSP* ":" unstructured CRLF

//comments      = "Comments"i WSP* ":" unstructured CRLF

keywords        = "Keywords"i WSP* ":" phrase ("," phrase)* CRLF

// 3.6.6. Resent fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.6>

resent_date     = "Resent-Date"i WSP* ":" date_time CRLF

// <https://datatracker.ietf.org/doc/html/rfc6854#section-2.2>
resent_from     = "Resent-From"i WSP* ":" (mailbox_list / address_list) CRLF

resent_sender   = "Resent-Sender"i WSP* ":" (mailbox / address) CRLF

resent_to       = "Resent-To"i WSP* ":" address_list CRLF

resent_cc       = "Resent-Cc"i WSP* ":" address_list CRLF

resent_bcc      = "Resent-Bcc"i WSP* ":" (address_list / CFWS)? CRLF

resent_msg_id   = "Resent-Message-ID"i WSP* ":" msg_id CRLF


// MS header used by feedback reports:
original_recipient =
                   "X-HmXmrOriginalRecipient:"i path CRLF

// 3.6.7. Trace fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.7>

//trace         = return?
//                received+

return          = "Return-Path"i WSP* ":" (path / addr_spec) CRLF

path            = angle_addr / (CFWS? "<" CFWS? ">" CFWS?)

received        = "Received"i WSP* ":" toks:(received_token / CFWS)* ";" date:date_time CRLF
                  {
                    let tokens: Record<string, string> = {};
                    if (toks) {
                      for (let i=0; (i+1)<toks.length; i+=2) {
                        tokens[toks[i]] = toks[i+1];
                      }
                    }
                    return {
                      tokens,
                      date
                    }
                  }

postmaster       = "<" ">"

// 1st match wins, so we must check the most specific rules first.
received_token  = tok:(angle_addr / addr_spec / domain / word / postmaster)
                  {
                    const token = tok.flat(99).join("").replace(/\r\n[ \t]+/, "").trim();
                    return token;
                  }

// 3.6.8. Optional fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.8>

// optional_field = field_name WSP* ":" unstructured CRLF

// field_name   = ftext+

// ftext        = [\x21-\x39] /         // Printable US-ASCII
//                [\x3B-\x7E]           //  characters not including ":".

// ########## MIME ##########

// RFC-2045 predates the message syntax reformulation that started
// with RFC-2822 that introduced all the "obs-" forms.

// 4.  MIME-Version Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-4>

version         = "MIME-Version"i WSP* ":"
                  CFWS? "1" CFWS? "." CFWS? "0" CFWS? CRLF
                  {
                    return new MIMEVersion();
                  }

// 5.1.  Syntax of the Content-Type Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-5.1>

content         = "Content-Type"i WSP* ":" CFWS? ty:type CFWS? "/" CFWS? sub:subtype CFWS?
                  params:(";" @parameter)* (";" CFWS?)? CRLF // <- Allow trailing ";" as an extension.
                  {
                    return new ContentType(ty.toLowerCase(),
                                           sub.toLowerCase(),
                                           params ? params.map(function(x:[string, Parameter]) { return x[1]; })
                                                  : []);
                    // The '@' before parameter is supposed to 'pick' out just the parameter from
                    // the enclosing parens, but this doesn't seem to actually work. Hence, the map
                    // call taking the Tuple [";", <the actual param>] returning just the param.
                  }
                  // Matching of media type and subtype
                  // is ALWAYS case-insensitive.

type            = discrete_type / composite_type / token

discrete_type   = "text"i / "image"i / "audio"i / "video"i /
                  "application"i

composite_type  = "message"i / "multipart"i

subtype         = $token

parameter       = CFWS? a:$attribute CFWS? "=" CFWS? v:$value CFWS?
                  {
                    // Some parameter values may be case sensitive.
                    const ret: Parameter = {};
                    ret[a.toLowerCase()] = v;
                    return ret;
                  }

attribute       = tok:$token
                  {
                    return tok.toLowerCase();
                  }
                  // Matching of attributes
                  // is ALWAYS case-insensitive.

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

encoding        = "Content-Transfer-Encoding"i WSP* ":" CFWS? mech:mechanism CFWS? CRLF
                  {
                    return new ContentTransferEncoding(mech.toLowerCase());
                  }

mechanism       = "7bit"i / "8bit"i / "binary"i /
                  "quoted-printable"i / "base64"i
                  // / token

// 7.  Content-ID Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-7>

id              = "Content-ID"i WSP* ":" CFWS? msg_id CFWS? CRLF

// 8.  Content-Description Header Field
// <https://datatracker.ietf.org/doc/html/rfc2045#section-8>

//description     = "Content-Description"i WSP* ":" unstructured CRLF

// 2.  The Content-Disposition Header Field
// <https://datatracker.ietf.org/doc/html/rfc2183#section-2>

disposition     = "Content-Disposition"i WSP* ":" CFWS? disposition_type CFWS?
                  (";" disposition_parm )* CRLF

disposition_type = "inline"i /
                   "attachment"i /
                   token        // values are not case-sensitive

disposition_parm = filename_parm /
                   creation_date_parm /
                   modification_date_parm /
                   read_date_parm /
                   size_parm /
                   parameter

filename_parm   = CFWS? "filename"i CFWS? "=" CFWS? value CFWS?

creation_date_parm = CFWS? "creation-date"i CFWS? "=" CFWS? quoted_date_time CFWS?

modification_date_parm = CFWS? "modification-date"i CFWS? "=" CFWS? quoted_date_time CFWS?

read_date_parm  = CFWS? "read-date"i CFWS? "=" CFWS? quoted_date_time CFWS?

size_parm       = "size"i "=" DIGIT+

quoted_date_time = quoted_string
                   // contents MUST be an RFC 822 `date-time'
                   // numeric timezones (+HHMM or -HHMM) MUST be used

// ########## Content-Location ##########
// <https://datatracker.ietf.org/doc/html/rfc2557#section-4.1>

content_location = "Content-Location"i FWS ":" CFWS? URL CFWS? CRLF

URL              = absoluteURL / relativeURL ('#' fragment)?

absoluteURL      = generic_RL / ( scheme ":" ( uchar / reserved )* )

generic_RL       = scheme ":" relativeURL

relativeURL      = net_path / abs_path / rel_path

net_path         = "//" net_loc abs_path?
abs_path         = "/"  rel_path
rel_path         = path_url? ( ";" params )? ( "?" query )?

path_url         = fsegment ( "/" segment )*
fsegment         = pchar+
segment          = pchar*

params           = param ( ";" param )*
param            = ( pchar / "/" )*

scheme           = ( ALPHA / DIGIT / "+" / "-" / "." )+
net_loc          = ( pchar / ";" / "?" )*
query            = ( uchar / reserved )*
fragment         = ( uchar / reserved )*

pchar            = uchar / ":" / "@" / "&" / "="
uchar            = unreserved / escape
unreserved       = ALPHA / DIGIT / safe / extra

safe             = "$" / "-" / "_" / "." / "+"
extra            = "!" / "*" / "'" / "(" / ")" / ","
reserved         = ";" / "/" / "?" / ":" / "@" / "&" / "="

escape           = "%" HEXDIG HEXDIG

// ########## Content-Language ##########
// <https://datatracker.ietf.org/doc/html/rfc3282#section-2>

content_language = "Content-Language"i WSP* ":" CFWS? language_list CFWS? CRLF

language_list   = language_tag CFWS?
                 ("," CFWS? language_tag CFWS?)*

// <https://datatracker.ietf.org/doc/html/rfc3066#section-2.1>

language_tag    = primary_subtag ( "-" subtag )*

primary_subtag  = ALPHA+

subtag          = (ALPHA / DIGIT)+

// ########## Accept-Language ##########
// <https://datatracker.ietf.org/doc/html/rfc3282#section-3>

accept_language = "Accept-Language"i WSP* ":" CFWS?
           language_q ( "," CFWS? language_q )* CFWS? CRLF

language_q      = language_range
                  ( CFWS? ";" CFWS? "q" CFWS? "=" qvalue )?

qvalue          = ( "0" ( "." (DIGIT DIGIT DIGIT)* )? )
                  / ( "1" ( "." "0"* )? )

language_range  = language_tag / "*"

// ########## Authentication-Results ##########
// <https://datatracker.ietf.org/doc/html/rfc8601#section-2.2>

authres_header_field = "Authentication-Results"i WSP* ":" authres_payload

authres_payload = CFWS? id:authserv_id
                  ( CFWS authres_version )?
                  results:( no_result / resinfo+ ) CFWS? CRLF
                  {
                    return new AuthResPayload(id.join(""), results);
                  }

authserv_id     = value

authres_version = DIGIT+ CFWS?
                  // indicates which version of this specification is in use;
                  // this specification is version "1", and the absence of a
                  // version implies this version of the specification

no_result       = CFWS? ";" CFWS? "none"i
                  // the special case of "none" is used to indicate that no
                  // message authentication was performed
                  {
                    return "none";
                  }

resinfo         = CFWS? ";" meth:methodspec reason:(CFWS reasonspec)?
                  prop:(CFWS propspec+)?
                  {
                    return new ResInfo(meth.method,
                                       meth.result,
                                       extractOptional(reason, 1),
                                       extractOptional(prop, 1));
                  }

methodspec      = CFWS? m:method CFWS? "=" CFWS? r:result
                  // indicates which authentication method was evaluated
                  // and what its output was
                  {
                    return { method: m[0].join(""), result: r.join("") };
                  }

// Without the rule that eats all the following whitespace...
quoted_string_only = DQUOTE (FWS? qcontent)* FWS? DQUOTE

// Add "action" as extension to the RFC.
reasonspec      = ("reason"i / "action"i) CFWS? "=" CFWS? (token / quoted_string_only)
                  // a free-form comment on the reason the given result
                  // was returned

propspec        = t:ptype CFWS? "." CFWS? p:property CFWS? "=" v:pvalue
                  // an indication of which properties of the message
                  // were evaluated by the authentication scheme being
                  // applied to yield the reported result
                  {
                    return new PropSpec(t.join(""),
                                        p.flat(99).join(""),
                                        v.flat(99).join(""));
                  }

method          = Keyword ( CFWS? "/" CFWS? method_version )?
                  // a method indicates which method's result is
                  // represented by "result"; it is one of the methods
                  // explicitly defined as valid in this document
                  // or is an extension method as defined below

method_version  = DIGIT+ CFWS?
                  // indicates which version of the method specification is
                  // in use, corresponding to the matching entry in the IANA
                  // "Email Authentication Methods" registry; a value of "1"
                  // is assumed if this version string is absent

result          = Keyword
                  // indicates the results of the attempt to authenticate
                  // the message; see below for details

ptype           = Keyword
                  // indicates whether the property being evaluated was
                  // a parameter to an SMTP command [SMTP], was a value taken
                  // from a message header field, was some property of
                  // the message body, or was some other property evaluated by
                  // the receiving MTA; expected to be one of the "property
                  // types" explicitly defined as valid, or an extension
                  // ptype, as defined below

// No need to treat any verb as special in our use.
// property      = special_smtp_verb / Keyword
property         = Keyword
                  // indicates more specifically than "ptype" what the
                  // source of the evaluated property is; the exact meaning
                  // is specific to the method whose result is being reported
                  // and is defined more clearly below

special_smtp_verb = "mailfrom"i / "rcptto"i
                  // special cases of SMTP commands [SMTP] that are made up
                  // of multiple words

pvalue          = CFWS? pv:( ( ( local_part? "@" )? domain ) / value )
                  CFWS?
                  // the value extracted from the message property defined
                  // by the "ptype.property" construction
                  {
                    return pv;
                  }

// ########## Authenticated Received Chain ##########
// <https://datatracker.ietf.org/doc/html/rfc8617>

position        = DIGIT DIGIT?                         // 1 - 50
instance        = CFWS? "i" CFWS? "="
                  CFWS? position

chain_status    = "none"i / "fail"i / "pass"i

seal_cv_tag     = "cv"i CFWS? "="
                  CFWS? chain_status

// 4.1.1
arc_info = inst:instance CFWS? ";" payload:authres_payload
         {
           return new ARCInfo(+ inst[5].join(""), payload);
         }

arc_authres_header = "ARC-Authentication-Results:"i CFWS? arc_info

// 4.1.2
arc_ams_info    = instance CFWS? ";" tag_list
arc_message_signature = "ARC-Message-Signature:"i CFWS? arc_ams_info CRLF

// 4.1.3
arc_as_info     = instance CFWS? ";" tag_list
arc_seal        = "ARC-Seal:"i CFWS? arc_as_info CRLF

// ########## Auto-Submitted ##########
// <https://datatracker.ietf.org/doc/html/rfc3834#section-5.1>

auto_submitted_field    = "Auto-Submitted"i WSP* ":" CFWS?
                           auto_submitted CFWS? CRLF

auto_submitted          = ( "no"i / "auto-generated"i /
                           "auto-replied"i / extension )
                           opt_parameter_list

extension               = token

opt_parameter_list      = ( CFWS? ";" CFWS? parameter )*

// From SMTP Command Argument Syntax
// <https://datatracker.ietf.org/doc/html/rfc5321#section-4.1.2>

// Keyword      = Ldh_str
Keyword         = [A-Za-z0-9-]*

Let_dig         = ALPHA / DIGIT

// This is a rule that can never match, as the greedy Kleene star eats the Let_dig.
Ldh_str         = ( ALPHA / DIGIT / "-" )* Let_dig

// ########## Require-Recipient-Valid-Since ##########
// <https://datatracker.ietf.org/doc/html/rfc7293#section-3.2>

rrvs            = "Require-Recipient-Valid-Since"i WSP* ":" CFWS? addr_spec CFWS? ";"
                   CFWS? date_time CRLF

// ########## DomainKeys Identified Mail (DKIM) Signature ##########
// <https://datatracker.ietf.org/doc/html/rfc6376>

dkim_sig        = "DKIM-Signature"i WSP* ":" FWS? tag_list CRLF

// Allow optional trailing space and the end of the line as an extension.
tag_list        =  tag_spec ( ";" tag_spec )* ";"? WSP*

tag_spec        =  FWS? tag_name FWS? "=" FWS? (tag_value FWS?)?

tag_name        =  ALPHA ALNUMPUNC*

tag_value       = tval ( (WSP / FWS)+ tval )*
                     // Prohibits WSP and FWS at beginning and end

tval            = VALCHAR+

VALCHAR         = [\x21-\x3A\x3C-\x7E] // %x21-3A / %x3C-7E
                     // EXCLAMATION to TILDE except SEMICOLON

ALNUMPUNC       = ALPHA / DIGIT / "_"

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

//obs-body      =   *((*LF *CR *((%d0 / text) *LF *CR)) / CRLF)
//obs_body      = ((LF* CR* (("\0" / text) LF* CR*)*) / CRLF)*

//EID 1905
//obs-unstruct  =   *( (*CR 1*(obs-utext / FWS)) / 1*LF ) *CR 
obs_unstruct    = ( (CR* (obs_utext / FWS)+) / LF+ )* CR*

obs_phrase      = word (word / "." / CFWS)*

obs_phrase_list = (phrase / CFWS)? ("," (phrase / CFWS)?)*

// 4.2.  Obsolete Folding White Space
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.2>

//obs_FWS       = WSP+ (CRLF WSP+)*

//EID 1908
obs_FWS         = (CRLF? WSP)+

// 4.3.  Obsolete Date and Time
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.3>

obs_day_of_week = CFWS? day_name CFWS?

obs_day         = CFWS? DIGIT DIGIT? CFWS?

obs_year        = CFWS? DIGIT DIGIT CFWS?

obs_hour        = CFWS? DIGIT DIGIT CFWS?

obs_minute      = CFWS? DIGIT DIGIT CFWS?

obs_second      = CFWS? DIGIT DIGIT CFWS?

                // UTC is an extension, commonly seen.
obs_zone        = "UTC"i / "UT"i / "GMT"i / // Universal Time
                  "EST"i / "EDT"i /     // Eastern:  - 5/ - 4
                  "CST"i / "CDT"i /     // Central:  - 6/ - 5
                  "MST"i / "MDT"i /     // Mountain: - 7/ - 6
                  "PST"i / "PDT"i /     // Pacific:  - 8/ - 7
                  [A-Ia-iK-Zk-z]        // Military zones - "A"
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

// Those obsolete fields that are the same except for extra space
// between the field_name and the ":" have been folded in to the
// standard definitions.

// obs_fields   = (obs_received
//                 obs_bcc /
//                 obs_in_reply_to /
//                 obs_references /
//                 obs_keywords /
//                 obs_resent_bcc)*

// 4.5.3.  Obsolete Destination Address Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.3>

obs_bcc         = "Bcc"i WSP* ":"
                  (address_list / ((CFWS? ",")* CFWS?)) CRLF

// 4.5.4.  Obsolete Identification Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.4>

obs_in_reply_to = "In-Reply-To"i WSP* ":" (phrase / msg_id / CFWS)* CRLF

obs_references  = "References"i WSP* ":" (phrase / msg_id)* CRLF

obs_id_left     = local_part

obs_id_right    = domain

// 4.5.5.  Obsolete Informational Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.5>

obs_keywords    = "Keywords"i WSP* ":" obs_phrase_list CRLF

// 4.5.6.  Obsolete Resent Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.6>

obs_resent_bcc  = "Resent-Bcc"i WSP* ":"
                  (address_list / ((CFWS? ",")* CFWS?)) CRLF

// 4.5.7.  Obsolete Trace Fields
// <https://datatracker.ietf.org/doc/html/rfc5322#section-4.5.7>

//obs_received  = "Received"i WSP* ":" received_token* CFWS? CRLF

// EID 3979, but not exactly since comments can appear intermixed with tokens.
obs_received    =   "Received"i *WSP ":" (received_token / CFWS)* CRLF
