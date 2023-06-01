const path = require('path');
const { registerJsonata } = require('../../utils');
/*
FIXME: Register IANA vnd. type according to [rfc6838](https://tools.ietf.org/html/rfc6838)
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
const RAS_JES_SU_MEDIA_TYPE = 'application/vnd.jes.journal+xml';
const RAS_JES_SU_ENCODING = 'utf-16le';
const RAS_JES_SU_FALLBACK_ENCODING = 'utf-8';

const RAS_JES_SU_START_MARKER = '<journal';
const RAS_JES_SU_END_MARKER = '</journal>';
const RAS_JES_SU_JOURNAL_RE = / *<journal.+<\/journal> */uig;

const RAS_JES_SU_XML2JSON_OPTIONS = {
  compact: true,
  alwaysArray: true,
  addParent: false,
};

const RAS_JES_SU_SCHEMA = {
  path: path.join(__dirname, 'schemas/ras.jes.su-rsl-1.0.0.xsd'),
  url: 'https://catalog.rusneb.ru/schemas/ras.jes.su-rsl-1.0.0.xsd',
};

const RAS_JES_SU_TO_ENTITY_JSONATA_PATH = path.join(__dirname, 'mappings/ras.jes.su-to-entity-1.0.0.jsonata');
const RAS_JES_SU_TO_ENTITY_JSONATA = registerJsonata(RAS_JES_SU_TO_ENTITY_JSONATA_PATH);
const RAS_RES_SU_DP_NAME = 'ras.jes.su'
const RAS_JES_SU_LANGUAGE='ru'
module.exports = {
  RAS_JES_SU_LANGUAGE,
  RAS_RES_SU_DP_NAME,
  RAS_JES_SU_TO_ENTITY_JSONATA,
  RAS_JES_SU_XML2JSON_OPTIONS,
  RAS_JES_SU_JOURNAL_RE,
  RAS_JES_SU_ENCODING,
  RAS_JES_SU_MEDIA_TYPE,
  RAS_JES_SU_START_MARKER,
  RAS_JES_SU_END_MARKER,
  RAS_JES_SU_TO_ENTITY_JSONATA_PATH,
  RAS_JES_SU_SCHEMA,
  RAS_JES_SU_FALLBACK_ENCODING,
};
