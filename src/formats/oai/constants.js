const OAI_2_0_SCHEMA_URI = 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd';
const OAI_2_0_SCHEMA_PATH = path.join(__dirname, 'schemas/2.0/oai_dc.xsd');

const OAI_2_0_NS = {
  'xmlns:oai_dc': 'http://www.openarchives.org/OAI/2.0/oai_dc/',
  'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
  'xsi:schemaLocation': 'http://www.openarchives.org/OAI/2.0/oai_dc/\nhttp://www.openarchives.org/OAI/2.0/oai_dc.xsd',
};