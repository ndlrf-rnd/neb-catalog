const path = require('path');

const LITRES_RU_XML_ENCODING = 'utf-8';

/*
TODO: Register IANA vnd. type according to [rfc6838](https://tools.ietf.org/html/rfc6838)
3.2.  Vendor Tree

   The vendor tree is used for media types associated with publicly
   available products.  "Vendor" and "producer" are construed very
   broadly in this context and are considered equivalent.  Note that
   industry consortia as well as non-commercial entities that do not
   qualify as recognized standards-related organizations can quite
   appropriately register media types in the vendor tree.

   A registration may be placed in the vendor tree by anyone who needs
   to interchange files associated with some product or set of products.
   However, the registration properly belongs to the vendor or
   organization producing the software that employs the type being
   registered, and that vendor or organization can at any time elect to
   assert ownership of a registration done by a third party in order to
   correct or update it.  See Section 5.5 for additional information.

   When a third party registers a type on behalf of someone else, both
   entities SHOULD be noted in the Change Controller field in the
   registration.  One possible format for this would be "Foo, on behalf
   of Bar".

   Vendor-tree registrations will be distinguished by the leading facet
   "vnd.".  That may be followed, at the discretion of the registrant,
   by either a media subtype name from a well-known producer (e.g.,
   "vnd.mudpie") or by an IANA-approved designation of the producer's
   name that is followed by a media type or product designation (e.g.,
   vnd.bigcompany.funnypictures).

   While public exposure and review of media types to be registered in
   the vendor tree are not required, using the media-types@iana.org
   mailing list for review is encouraged, to improve the quality of
   those specifications.  Registrations in the vendor tree may be
   submitted directly to the IANA, where they will undergo Expert Review
   [RFC5226] prior to approval.
   */

const LITRES_RU_XML_MEDIA_TYPE = 'application/vnd.litres.publication+xml';
const LITRES_RU_XML2JSON_OPTIONS = {
  compact: true,
  alwaysArray: true,
  trim: false,
  alwaysChildren: false,
};

const LITRES_RU_SCHEMA = {
  path: path.join(__dirname, 'schemas/litres.ru-1.0.0.xsd'),
  url: 'https://catalog.rusneb.ru/schemas/litres.ru-1.0.0.xsd',
  mediaType: 'application/xml',
};

const LITRES_RU_XML_SEPARATOR = '</updated-book>';
const LITRES_TO_ENTITY_JSONATA_PATH = path.join(__dirname, 'mappings/litres_entity_mapping_v_0_1_0.jsonata');
const LITRES_TO_OPDS2_JSONATA_PATH = path.join(__dirname, 'mappings/litres.ru-to-opds2-0.3.0.jsonata');

const LITRES_COLLECTION_RE = /(<fb-updates[^>]*>)(.+)(<\/fb-updates[^>]*>)/uig;

module.exports = {
  LITRES_RU_XML_ENCODING,
  LITRES_RU_XML_MEDIA_TYPE,
  LITRES_RU_XML2JSON_OPTIONS,
  LITRES_RU_XML_SEPARATOR,
  LITRES_COLLECTION_RE,
  LITRES_RU_SCHEMA,
  LITRES_TO_ENTITY_JSONATA_PATH,
  LITRES_TO_OPDS2_JSONATA_PATH,
};