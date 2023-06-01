const path = require('path');
/**
 * Information source: http://www.library.mcgill.ca/ALEPH/version16/ALEPH_15.2_User_Guide.pdf
 */


const ALEF_DOC_URI = 'http://www.library.mcgill.ca/ALEPH/version16/ALEPH_15.2_User_Guide.pdf';
const ALEF_JSON_SCHEMA_URI = 'https://catalog.rusneb.ru/schemas/alef-rsl-15.2.0.json';
const ALEF_JSON_SCHEMA_PATH = path.join(__dirname, 'schemas/alef/alef-rsl-15.2.0.json');
/*
10.2 LKR FIELD
Links in ALEPH can either be system-generated (e.g., links of copies to a bibliographic record), or
user-generated (e.g., links between two bibliographic records and/or a bibliographic record and items
that belong to another bibliographic record).

The LKR field is used to create links from one bibliographic record to another, e.g., for analytical
purposes, changed titles for serial publications, etc. The possible types of links and the values that
must be entered to generate these links are shown in the table below. Note that the LKR field is
cataloged in only one of the records; the system will create the other side of the link

Subfield Description
a Value Use
  UP An up link to another bibliographic record. A record can have only one link of
  this type. A DN link is automatically built in the opposite direction.

  DN A down link to another bibliographic record. Multiple links are possible. An
     UP link is automatically built in the opposite direction.

  PAR A parallel link from one bibliographic record to another. A PAR link is
  automatically built in the opposite direction.

  ANA The ANA link creates both ITM and UP-DN type links. In other words, it
      creates a link between the two bibliographic records and to the item/s.
      * Note that subfield $b for this type of link contains the system number of the
      bibliographic record to which the record is linked (unlike the ITM type link).

  ITM The ITM link creates a link between one bibliographic record and the items of
      another bibliographic record. The item filter fields ($y, $v, $p, and $i must be
      used for this type of link.

*Note that subfield $b for this type of link contains the ADM system number.

b System number of the linked record (the target record)
i Issue link      // Item filter
k Pages
l Library where target record is located
m Down link note
n Up link note
p Part link       // Item filter
r MARC tag link
v Volume link     // Item filter
y Year link       // Item filter

Note that values entered in subfield $a must be in uppercase.
The System Librarian may have the system check the validity of the library and document number in
the LKR field when the cataloger chooses the "Check Record" option on the "Edit" menu. To do this,
the System Librarian must include the "check_doc_lkr" program in the list of programs that appear in
the check_doc table (UTIL M/8)
*/
const parseLkr = (field) => {

  return {};
};
/*
10.3 "OWN" FIELD
The OWN field is used to control update access to all types of MARC records (BIB, HOL, ADM,
AUT). The user is checked for access/update permission according to the contents of the record's
OWN field(s).
The OWN field can contain any kind of text for grouping (such as sublibrary).
Access permission is defined through the Privileges function (Administration module - 2.2 User -
Password Information) by assigning the cataloger the following:
A default value of the OWN field for new records created by the cataloger (Cat. OWN ID). The
OWN field with the defined value can be set to be inserted in the record by performing a fix
program, fix_doc_own_1.
1.
The value of the OWN field of the user that will be checked against the OWN field(s) of the
record for update authorization (Cat. OWN Permission). If the value of the Cat. OWN
Permission field is equal to any of the OWN fields of the record; or if the content of one of the
OWN fields of the record is PUBLIC; or if the value of the Cat. OWN Permission field is
GLOBAL, then the user will be allowed to update the record. Otherwise, the user will not be
allowed to update the record.
2.
If a catalog proxy is assigned to the user (see the Administration module - 2.2 User - Password
Information, then the OWN values for the user are taken from the proxy's record.
Note that the system librarian can assign a group of allowed OWN values for a cataloger (see
Cataloging "OWN" Permissions).
 */
const parseOwn = (field) => {
  return {};
};

/*
parseLkr
 */
module.exports = {
  parseLkr,
  parseOwn,
  ALEF_JSON_SCHEMA_PATH,
  ALEF_JSON_SCHEMA_URI,
  ALEF_DOC_URI,
};
