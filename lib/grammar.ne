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
%}

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.1>

### <https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1>

ALPHA           -> [A-Za-z]

CR              -> [\x0D]

CRLF            -> CR LF         # Internet standard newline

DIGIT           -> [0-9]

DQUOTE          -> [\x22]        # " (Double Quote)

HTAB            -> [\x09]        # horizontal tab

LF              -> [\x0A]        # linefeed

SP              -> [\x20]

VCHAR           -> [\x21-\x7E]   # visible (printing) characters

WSP             -> SP | HTAB     # white space

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.1>

quoted_pair     ->   ("\\" (VCHAR | WSP)) ##| obs_qp

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.2>

FWS             -> ((WSP:* CRLF):? WSP:+) ##| obs_FWS
                                          # Folding white space

ctext           -> [\x21-\x27] |          # Printable US-ASCII
                   [\x2A-\x5B] |          #  characters not including
                   [\x5D-\x7E]            #  "(", ")", or "\"
                   ##| obs_ctext

ccontent        -> ctext | quoted_pair | comment

comment         -> "(" (FWS:? ccontent):* FWS:? ")"

CFWS            -> ((FWS:? comment):+ FWS:?) | FWS

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.3>

atext           -> ALPHA | DIGIT |    # Printable US-ASCII
                   "!" | "#" |        #  characters not including
                   "$" | "%" |        #  specials.  Used for atoms.
                   "&" | "'" |
                   "*" | "+" |
                   "-" | "|" |
                   "=" | "?" |
                   "^" | "_" |
                   "`" | "{" |
                   "|" | "}" |
                   "~"

atom            -> CFWS:? atext:+ CFWS:? {%
                    function(d) {
                        return { atom: flat_string(d[1]) };
                    }
                  %}

dot_atom_text   -> atext:+ ("." atext:+):*

dot_atom        -> CFWS:? dot_atom_text CFWS:?

specials        -> "(" | ")" |        # Special characters that do
                   "<" | ">" |        #  not appear in atext
                   "[" | "]" |
                   ":" | ";" |
                   "@" | "\\" |
                   "," | "." |
                   DQUOTE

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.4>

qtext           -> [\x21]      |     # Printable US-ASCII
                   [\x23-\x5B] |     #  characters not including
                   [\x5D-\x7E]       #  "\" or the quote character
                   ##| obs_qtext

qcontent        -> qtext | quoted_pair

quoted_string   -> CFWS:?
                   DQUOTE (FWS:? qcontent):* FWS:? DQUOTE
                   CFWS:?

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.2.5>

word            -> atom | quoted_string

phrase          -> word:+ ##| obs_phrase

unstructured    -> ((FWS:? VCHAR) WSP:*):* ##| obs_unstruct

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4>

address         -> mailbox | group

mailbox         -> name_addr | addr_spec

name_addr       -> display_name:? angle_addr

angle_addr      -> CFWS:? "<" addr_spec ">" CFWS:?
                   ##| obs_angle_addr

group           -> display_name ":" group_list:? ";" CFWS:?

display_name    -> phrase

mailbox_list    -> (mailbox ("," mailbox):* ) ##| obs_mbox_list

address_list    -> (address ("," address):*) ##| obs_addr_list

group_list      -> mailbox_list | CFWS ##| obs_group_list

## <https://datatracker.ietf.org/doc/html/rfc5322#section-3.4.1>

addr_spec       -> local_part "@" domain

local_part      -> dot_atom | quoted_string ##| obs_local_part

domain          -> dot_atom | domain_literal ##| obs_domain

domain_literal  -> CFWS:? "[" (FWS:? dtext):* FWS:? "]" CFWS:?

dtext           -> [\x21-\x5B] |          # Printable US-ASCII
                   [\x5E-\x7E]            #  characters not including
                   ##| obs_dtext          #  "[", "]", or "\"

