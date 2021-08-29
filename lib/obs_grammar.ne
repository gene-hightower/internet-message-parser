## <https://datatracker.ietf.org/doc/html/rfc5322#section-4.1>

obs_NO_WS_CTL   ->  [\x01-\x08] |         # US-ASCII control
                    [\x0B] |              #  characters that do not
                    [\x0C] |              #  include the carriage
                    [\x0E-\x1F] |         #  return, line feed, and
                    [\x7F]                #  white space characters

obs_ctext       -> obs_NO_WS_CTL

obs_qtext       -> obs_NO_WS_CTL

obs_utext       -> [\x00] | obs_NO_WS_CTL | VCHAR

obs_qp          -> "\\" ([\x00] | obs_NO_WS_CTL | LF | CR)

obs_body        -> ((LF:* CR:* (([\x00] | text) LF:* CR:*):*) | CRLF):*

#obs_unstruct    -> ((LF:* CR:* (obs_utext LF:* CR:*)):* | FWS):*
obs_unstruct    ->  ( (CR:* (obs_utext | FWS):+) | LF:+ ):* CR:*

obs_phrase      -> word (word | "." | CFWS):*

obs_phrase_list -> (phrase | CFWS):? ("," (phrase | CFWS):?):*

## <https://datatracker.ietf.org/doc/html/rfc5322#section_4.2>

obs_FWS         -> WSP:+ (CRLF WSP:+):*

## <https://datatracker.ietf.org/doc/html/rfc5322#section_4.3>

## obs_day_of_week -> CFWS:? day_name CFWS:?

## obs_day         -> CFWS:? 1*2DIGIT CFWS:?

## obs_year        -> CFWS:? 2*DIGIT CFWS:?

## obs_hour        -> CFWS:? 2DIGIT CFWS:?

## obs_minute      -> CFWS:? 2DIGIT CFWS:?

## obs_second      -> CFWS:? 2DIGIT CFWS:?

## obs_zone        -> "UT" | "GMT" |      # Universal Time
##                                        # North American UT
##                                        # offsets
##                    "EST" | "EDT" |     # Eastern:  - 5/ - 4
##                    "CST" | "CDT" |     # Central:  - 6/ - 5
##                    "MST" | "MDT" |     # Mountain: - 7/ - 6
##                    "PST" | "PDT" |     # Pacific:  - 8/ - 7

##                    [A-IK-Za-ik-z]      # Military zones - "A"
##                                        # through "I" and "K"
##                                        # through "Z", both
##                                        # upper and lower case

## <https://datatracker.ietf.org/doc/html/rfc5322#section-4.4>

obs_angle_addr  -> CFWS:? "<" obs_route addr_spec ">" CFWS:?

obs_route       -> obs_domain_list ":"

obs_domain_list -> (CFWS | ","):* "@" domain
                   ("," CFWS:? ["@" domain]):*

obs_mbox_list   -> (CFWS:? ","):* mailbox ("," (mailbox | CFWS):?):*

obs_addr_list   -> (CFWS:? ","):* address ("," (address | CFWS):?):*

obs_group_list  -> (CFWS:? ","):+ CFWS:?

obs_local_part  -> word ("." word):*

obs_domain      -> atom ("." atom):*

obs_dtext       -> obs_NO_WS_CTL | quoted_pair
