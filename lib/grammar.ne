@preprocessor typescript

@{%
const deepFlatten = (arr: any) =>
  [].concat(...arr.map((v: any) => (Array.isArray(v) ? deepFlatten(v) : v)));

function flat_string(d: any) {
  if (d) {
    if (Array.isArray(d))
      return deepFlatten(d).join("");
    return d;
  }
  return "";
}

/*
const moo = require("moo");

const lexer = moo.compile({
  quoted_string_tok:  /"(?:[\x21\x23-\x5B\x5D-\x7E]|(?:\\.))*"/,
  domain_literal_tok: /\[[\x21-\x5B\x5E-\x7E]*\]/,
  atom_tok:           /[A-Za-z0-9!#$%&'*+\-\\=?^_`{|}~]+/,
  "(":                /\(/,
  ")":                /\)/,
  "<":                /</,
  ">":                />/,
  "@":                /@/,
  ",":                /,/,
  ";":                /;/,
  ":":                /:/,
  "\\":               /\\/,
  "\"":               /"/,
  ".":                /\./,
  "[":                /\[/,
  "]":                /\]/,
  SP:                 / /,
  HTAB:               /\t/
});
*/

%}

### @lexer lexer

# Some macros

times_3[X]     -> $X $X $X
times_5[X]     -> $X $X $X $X $X
times_7[X]     -> $X $X $X $X $X $X $X

## 4.1.3.  Address Literals
## <https://tools.ietf.org/html/rfc5321#section-4.1.3>

IPv4_address_literal -> Snum times_3["."  Snum]

IPv6_address_literal -> "IPv6:"i IPv6_addr

General_address_literal -> Standardized_tag ":" dcontent:+

Standardized_tag  -> Ldh_str
                   # Standardized_tag MUST be specified in a
                   # Standards_Track RFC and registered with IANA

dcontent       -> [\x21-\x5a\x5e-\x7e] {% id %}
                # Printable US_ASCII
                # excl. "[", "\", "]"

Snum           -> DIGIT |
                ( [1-9] DIGIT ) |
                ( "1" DIGIT DIGIT ) |
                ( "2" [0-4] DIGIT ) |
                ( "2" "5" [0-5] )
                # representing a decimal integer
                # value in the range 0 through 255

IPv6_addr      -> IPv6_full | IPv6_comp | IPv6v4_full | IPv6v4_comp

                # HEXDIG:? HEXDIG:? HEXDIG:? HEXDIG
IPv6_hex       -> HEXDIG |
                ( HEXDIG HEXDIG ) |
                ( HEXDIG HEXDIG HEXDIG ) |
                ( HEXDIG HEXDIG HEXDIG HEXDIG )

IPv6_full      -> IPv6_hex times_7[":" IPv6_hex]

IPv6_comp      -> (IPv6_hex times_5[":" IPv6_hex]):? "::"
                  (IPv6_hex times_5[":" IPv6_hex]):?
                # The "::" represents at least 2 16_bit groups of
                # zeros.  No more than 6 groups in addition to the
                # "::" may be present.

IPv6v4_full    -> IPv6_hex times_5[":" IPv6_hex] ":" IPv4_address_literal

IPv6v4_comp    -> (IPv6_hex times_3[":" IPv6_hex]):? "::"
                  (IPv6_hex times_3[":" IPv6_hex] ":"):?
                  IPv4_address_literal
                # The "::" represents at least 2 16_bit groups of
                # zeros.  No more than 4 groups in addition to the
                # "::" and IPv4_address_literal may be present.


## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.1>
### <https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1>

ALPHA           -> [A-Za-z] {% id %}

CR              -> [\x0D] {% id %}

CRLF            -> CR LF         # Internet standard newline

DIGIT           -> [0-9] {% id %}

HEXDIG          -> [0-9A-Fa-f] {% id %}

DQUOTE          -> [\x22] {% id %}        # " (Double Quote)

HTAB            -> [\x09] {% id %}        # horizontal tab

LF              -> [\x0A] {% id %}        # linefeed

SP              -> [\x20] {% id %}

VCHAR           -> [\x21-\x7E] {% id %}   # visible (printing) characters

WSP             -> SP {% id %}
                   | HTAB {% id %}     # white space

# some of my own basic rules:

ALPHA_DIGIT_U  -> [0-9A-Za-z\u0080-\uFFFF] {% id %}

ALPHA_DIGIT    -> [0-9A-Za-z] {% id %}

ALPHA_DIG_DASH -> [-0-9A-Za-z] {% id %}

ALPHA_DIG_DASH_U -> [-0-9A-Za-z\u0080-\uFFFF] {% id %}

## 3.2.1.  Quoted characters
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.1>

quoted_pair     ->   ("\\" (VCHAR | WSP)) ##| obs_qp

## 3.2.2.  Folding White Space and Comments
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.2>

#FWS            -> ((WSP:* CRLF):? WSP:+) ##| obs_FWS
                                       # Folding white space

FWS            -> WSP:+                 # Header must be unfolded


ctext           -> [\x21-\x27\x2A-\x5B\x5D-\x7E]

## ctext           -> [\x21-\x27] |        # Printable US-ASCII
##                    [\x2A-\x5B] |        #  characters not including
##                    [\x5D-\x7E]          #  "(", ")", or "\"
##                    ##| obs_ctext

ccontent        -> ctext | quoted_pair | comment

comment         -> "(" (FWS:? ccontent):* FWS:? ")"

CFWS            -> ((FWS:? comment):+ FWS:?) | FWS
#CFWS -> [ \t]

## 3.2.3.  Atom
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.3>

atext           -> [A-Za-z0-9!#$%&'*+\-\\=?^_`{|}~]
## atext           -> ALPHA | DIGIT |      # Printable US-ASCII
##                    "!" | "#" |          #  characters not including
##                    "$" | "%" |          #  specials.  Used for atoms.
##                    "&" | "'" |
##                    "*" | "+" |
##                    "-" | "\\" |
##                    "=" | "?" |
##                    "^" | "_" |
##                    "`" | "{" |
##                    "|" | "}" |
##                    "~"

#atom            -> [A-Za-z0-9!#$%&'*+\-\\=?^_`{|}~]:+
#atom            -> [A-Za-z0-9]:+
#atom            -> CFWS:? %atom_tok CFWS:?

atom            -> CFWS:? [A-Za-z0-9!#$%&'*+\-\\=?^_`{|}~]:+ CFWS:?
                   {%
                     function(d) {
                       console.error(`##### atom ${d[1]}`);
                       return flat_string(d[1]);
                     }
                   %}

dot_atom_text   -> atext:+ ("." atext:+):*

dot_atom        -> CFWS:? dot_atom_text CFWS:?
                   ## {%
                   ##   function(d) {
                   ##     return flat_string(d[1]);
                   ##   }
                   ## %}

specials        -> "(" | ")" |          # Special characters that do
                   "<" | ">" |          #  not appear in atext
                   "[" | "]" |
                   ":" | ";" |
                   "@" | "\\" |
                   "," | "." |
                   DQUOTE

## 3.2.4.  Quoted Strings
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.4>

qtext           -> [\x21]      {% id %} |       # Printable US-ASCII
                   [\x23-\x5B] {% id %} |       #  characters not including
                   [\x5D-\x7E] {% id %}         #  "\" or the quote character
                   ##| obs_qtext

qcontent        -> qtext {% id %}
                   | quoted_pair {% id %}

quoted_string   -> CFWS:?
                   DQUOTE (FWS:? qcontent):* FWS:? DQUOTE
                   CFWS:?
                   {%
                     function(d) {
                       console.log(`##### quoted_string ${d[2]}`);
                       return d[2];
                     }
                   %}

## 3.2.5.  Miscellaneous Tokens
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.5>

word            -> atom {% id %}
                   | quoted_string {% id %}

phrase          -> word:+ ##| obs_phrase

##unstructured    -> ((FWS:? VCHAR) WSP:*):* ##| obs_unstruct

## 3.3.  Date and Time Specification
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.3>

date_time       -> ( day_of_week "," ):? date time CFWS:?

day_of_week     -> (FWS:? day_name) ##| obs_day_of_week

day_name        -> "Mon"i | "Tue"i | "Wed"i | "Thu" | "Fri"i | "Sat"i | "Sun"i

date            -> day month year

TWODIGIT        -> DIGIT DIGIT

FOURDIGIT       -> DIGIT DIGIT DIGIT DIGIT

day             -> (FWS:? TWODIGIT FWS) ## obs_day

month           -> "Jan"i | "Feb"i | "Mar"i | "Apr"i |
                   "May"i | "Jun"i | "Jul" | "Aug"i |
                   "Sep"i | "Oct"i | "Nov"i | "Dec"i

year            -> (FWS FOURDIGIT FWS) ##| obs_year

time            -> time_of_day zone

time_of_day     -> hour ":" minute ( ":" second ):?

hour            -> TWODIGIT ##| obs_hour

minute          -> TWODIGIT ##| obs_minute

second          -> TWODIGIT ##| obs_second

zone            -> (FWS ( "+" | "-" ) FOURDIGIT) ##| obs_zone

## 3.4.  Address Specification
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4>

address         -> mailbox | group

mailbox         -> name_addr | addr_spec

name_addr       -> display_name:? angle_addr
                   ## {%
                   ##   function(d) {
                   ##     return { name: flat_string(d[0]),
                   ##              address: flat_string(d[1]),
                   ##     };
                   ##   }
                   ## %}

angle_addr      -> CFWS:? "<" addr_spec ">" CFWS:?
                   ##| obs_angle_addr
                   ## {%
                   ##   function(d) {
                   ##     return { addr_spec: flat_string(d[2]), };
                   ##   }
                   ## %}

group           -> display_name ":" group_list:? ";" CFWS:?

display_name    -> phrase
                   ## {%
                   ##   function(d) {
                   ##     return { display_name: flat_string(d[0]) };
                   ##   }
                   ## %}

mailbox_list    -> (mailbox ("," mailbox):* ) ##| obs_mbox_list

address_list    -> (address ("," address):*) ##| obs_addr_list

group_list      -> mailbox_list | CFWS ##| obs_group_list

## 3.4.1.  Addr-Spec Specification
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1>

#addr_spec       -> local_part "@" non_local_part
addr_spec       -> local_part "@" domain
                   ## {%
                   ##   function(d) {
                   ##     return { localPart: flat_string(d[0]),
                   ##             domainPart: flat_string(d[2]) };
                   ##   }
                   ## %}

## Supplemental rules from
## <https://tools.ietf.org/html/rfc5321#section-4.1.2>
#domain         -> sub_domain ("." sub_domain):*

domain         -> dot_atom | domain_literal ##| obs_domain

domain_literal -> CFWS:? "[" (FWS:? dtext):* FWS:? "]" CFWS:?

#A_label       -> Let_dig (Ldh_str):?

sub_domain     -> U_label

Let_dig        -> ALPHA_DIGIT {% id %}

Ldh_str        -> ALPHA_DIG_DASH:* Let_dig

U_Let_dig      -> ALPHA_DIGIT_U {% id %}

U_Ldh_str      -> ALPHA_DIG_DASH_U:* U_Let_dig

U_label        -> U_Let_dig (U_Ldh_str):?

address_literal  -> "[" ( IPv4_address_literal |
                          IPv6_address_literal |
                          General_address_literal ) "]"
                    # See <https://datatracker.ietf.org/doc/html/rfc5321#section-4.1.3>

non_local_part -> domain
                  {%
                    function(d) {
                        return { domain: flat_string(d[0]) };
                    }
                  %}
                  | address_literal {%
                     function(d) {
                       return { address_literal: flat_string(d[0]) };
                     }
                  %}

local_part     -> dot_atom
                  ## {%
                  ##   function(d) {
                  ##     return { dot_string: flat_string(d[0]) };
                  ##   }
                  ## %}
                  | quoted_string
                  ## {%
                  ##   function(d) {
                  ##     return { quoted_string: flat_string(d[0]) };
                  ##   }
                  ## %}
                  ## | obs_local_part

dtext           -> [\x21-\x5B] |        # Printable US-ASCII
                   [\x5E-\x7E]          #  characters not including
                   ##| obs_dtext        #  "[", "]", or "\"

## 3.6.  Field Definitions
fields          ->
                 return                 # Trace Fields
                 | received
                 | orig_date
                 | from                 # Originator Fields
                 | sender
                 | reply_to
                 | to                   # Destination Address Fields
                 | cc
                 | bcc
                 | message_id           # Identification Fields
                 | in_reply_to
                 | references
                 | version              # MIME headers
                 | content
                 | encoding
                 | id
###                 | description

## 3.6.1.  The Origination Date Field
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.1>

orig_date       -> "Date"i CFWS:? ":" date_time

## 3.6.2.  Originator Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.2>

from            -> "From"i CFWS:? ":" mailbox_list

sender          -> "Sender"i CFWS:? ":" mailbox

reply_to        -> "Reply-To"i CFWS:? ":" address_list

## 3.6.3.  Destination Address Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.3>

to              -> "To"i CFWS:? ":" address_list

cc              -> "Cc"i CFWS:? ":" address_list

bcc             -> "Bcc"i CFWS:? ":" address_list

## 3.6.4.  Identification Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.4>

message_id      -> "Message-ID"i CFWS:? ":" msg_id

in_reply_to     -> "In-Reply-To"i CFWS:? ":" msg_id:+

references      -> "References"i CFWS:? ":" msg_id:+

msg_id          -> CFWS:? "<" id_left "@" id_right ">" CFWS:?

id_left         -> dot_atom_text

id_right        -> dot_atom_text | no_fold_literal

no_fold_literal -> "[" dtext:* "]"

## 3.6.5.  Informational Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.5>

##subject         -> "Subject"i CFWS:? ":" unstructured

##comments        -> "Comments"i CFWS:? ":" unstructured

keywords        -> "Keywords"i CFWS:? ":" phrase ("," phrase):*

## 3.6.6.  Resent Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.6>

resent_date     -> "Resent-Date"i CFWS:? ":" date_time

resent_from     -> "Resent-From"i CFWS:? ":" mailbox_list

resent_sender   -> "Resent-Sender"i CFWS:? ":" mailbox

resent_to       -> "Resent-To"i CFWS:? ":" address_list

resent_cc       -> "Resent-Cc"i CFWS:? ":" address_list

resent_bcc      -> "Resent-Bcc"i CFWS:? ":" (address_list | CFWS):?

resent_msg_id   -> "Resent-Message-ID"i CFWS:? ":" msg_id

## 3.6.7.  Trace Fields
## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.6.7>

return          -> "Return-Path"i CFWS:? ":" path

path            -> angle_addr | (CFWS:? "<" CFWS:? ">" CFWS:?)

received        -> "Received" CFWS:? ":" received_token:* ";" date_time

received_token  -> word {% id %}
                   | angle_addr
                   | addr_spec
                   | domain

## 4.  MIME-Version Header Field
## <https://datatracker.ietf.org/doc/html/rfc2045#section-4>

version         -> "MIME-Version"i CFWS:? ":" CFWS:? DIGIT:+ CFWS:? "." CFWS:? DIGIT:+ CFWS:?
                   ## {%
                   ##   function(d) {
                   ##     return { version: `${d[5]}.${d[9]}` };
                   ##   }
                   ## %}

## 5.  Content-Type Header Field
## <https://datatracker.ietf.org/doc/html/rfc2045#section-5>

content         -> "Content-Type"i CFWS:? ":" CFWS:? type CFWS:? "/" CFWS:? subtype CFWS:?
                  (";" CFWS:? parameter):*
                  {%
                    function(d) {
                      if (d[10][0]) {
                        return {       type: flat_string(d[4]),
                                    subtype: flat_string(d[8]),
                                 attributes: d[10][0][2] };
                      } else {
                        return {    type: flat_string(d[4]),
                                 subtype: flat_string(d[8]) };
                      }
                    }
                  %}

type            -> token {% id %}

subtype         -> token {% id %}

parameter       -> attribute CFWS:? "=" CFWS:? value
                   {%
                     function(d) {
                       return { attribute: flat_string(d[0]), value: flat_string(d[4]) };
                     }
                   %}

attribute       -> token {% id %}

value           -> token {% id %} | quoted_string {% id %}

token           -> [^\x00-\x20\(\)\<\>@,;:\\"/\[\]\?=]:+ # 1*<any (US-ASCII) CHAR except SPACE, CTLs, or tspecials>

## 6.1.  Content-Transfer-Encoding Syntax
## <https://datatracker.ietf.org/doc/html/rfc2045#section-6.1>

encoding        -> "Content-Transfer-Encoding"i CFWS:? ":" CFWS:? mechanism CFWS:?
                   {%
                     function(d) {
                       return { mechanism: flat_string(d[4]) };
                     }
                   %}

mechanism       -> token {% id %}

## 7.  Content-ID Header Field
## <https://datatracker.ietf.org/doc/html/rfc2045#section-7>

id              -> "Content-ID"i CFWS:? ":" msg_id

## 8.  Content-Description Header Field
## <https://datatracker.ietf.org/doc/html/rfc2045#section-8>

##description     -> "Content-Description"i CFWS:? ":" [.]:*
