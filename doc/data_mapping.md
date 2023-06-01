# Fields mapping

## MARC 21 to DCMI notes
asf


Information source:
- [Karen Coyle on the Web - BIBFRAME examples 2019](http://kcoyle.net/bibframe/)
- [BSR to BIBFRAME Mapping](https://www.loc.gov/aba/pcc/bibframe/TaskGroups/BSR-PDF/BSRtoBIBFRAMEMapping.pdf)
- [Titles BIBFRAME Topics and Issues](http://www.loc.gov/bibframe/topics/titles.html)
- [Dublin Core to MARC Crosswalk](http://www.loc.gov/marc/dccross.html)
- [MARC to Dublin Core Crosswalk](https://www.loc.gov/marc/marc2dc.html)
- [Using Dublin Core - Dublin Core Qualifiers](https://www.dublincore.org/specifications/dublin-core/usageguide/qualifiers/)
- [Mappings from MARC 21 to EDM - Europeana Pro](https://pro.europeana.eu/files/Europeana_Professional/EuropeanaTech/EuropeanaTech_taskforces/Mapping_Refinement_Extension/Case_studies/Polymath/Mapping%20EDM%20explanations.doc)
- [BIBFRAME implementations registry](http://www.loc.gov/bibframe/implementation/register.html)
- [BIBFRAME note types](https://www.loc.gov/bibframe/docs/pdf/bf2-notes-june2016.pdf)
- [Best Practice Poster: MARC to schema.org: Providing Better Access to UIUC Library Holdings Data](https://pdfs.semanticscholar.org/a118/5207eff24c2ef176509b069bc099e1131da4.pdf)

## Character Position 06: Type of record

### Europeana manual

| LDR 06 - Type of record | Value for dc:type | edm:type |
| ----------------------- | ----------------- | -------- |
| a | Language material | TEXT | 
| c | Notated music | TEXT | 
| d | Manuscript notated music | TEXT | 
| e | Cartographic material | IMAGE | 
| f | Manuscript cartographic material | IMAGE | 
| g | Projected medium | IMAGE | 
| i | Nonmusical sound recording | SOUND | 
| j | Musical sound recording | SOUND | 
| k | Two dimensional nonprojectable graphic | IMAGE | 
| m (1) | Computer file, except m(2) and m(3) | TEXT | 
| m (2) | Computer file (and 008/26=h) | SOUND | 
| m (3) | Computer file (and 008/33=v) | VIDEO | 
| o | Kit | 
| p | Mixed materials | 
| r | Three dimensional artifact or naturally occurring object | IMAGE | 
| t | Manuscript language material | TEXT | 
| 007/00=v | Videorecording | VIDEO | 
| 008/33=v | Videorecording | VIDEO | 

`Leader/06` -> `edm:type`

```json
{
    "a": "TEXT",
    "c": "TEXT",
    "d": "TEXT",
    "e": "IMAGE",
    "f": "IMAGE",
    "g": "IMAGE",
    "i": "SOUND",
    "j": "SOUND",
    "k": "IMAGE",
    "r": "IMAGE",
    "t": "TEXT",
    "0": "VIDEO"
}
```

`Leader/06` -> `dc:type`

```json
{
    "a": "Language material",
    "c": "Notated music",
    "d": "Manuscript notated music",
    "e": "Cartographic material",
    "f": "Manuscript cartographic material",
    "g": "Projected medium",
    "i": "Nonmusical sound recording",
    "j": "Musical sound recording",
    "k": "Two dimensional nonprojectable graphic",
    "o": "Kit",
    "p": "Mixed materials",
    "r": "Three dimensional artifact or naturally occurring object",
    "t": "Manuscript language material",
    "0": "Videorecording"
}
```

### Casual mapping

`Leader/06` value should be set according to value in `Type` as follows (these values are from Dublin Core List of Resource Types (DC Type Vocabulary):

| Type value | Leader/06 | value |
| ---------- | --------- | ----- |
| collection | p | |
| dataset | m | |
| event | r | |
| image | k | |
| interactive resource | m | |
| service | m | |
| software | m | |
| sound | i | |
| text | a | |

JSON mapping:

```json
{
    "p": "collection",
    "r": "event",
    "k": "image",
    "m": "interactive resource",
    "i": "sound",
    "a": "text"
}
```


# Europeana Data Model
## Core classes
### Properties for edm:ProvidedCHO

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| + | dc:contributor | |
|   | dc:coverage | |
| + | dc:creator | |
| + | dc:date | |
| ➞ | dc:description | |
|   | dc:format | |
| + | dc:identifier | |
| ✔ | dc:language (if edm:type = TEXT) dcterms:replaces | |
| + | dc:publisher | |
|   | dc:relation | |
|   | dc:rights | |
| + | dc:source | |
| ⭕ | dc:subject | |
| ➞ | dc:title | |
| ⭕ | dc:type | |
| + | dcterms:alternative | |
|   | dcterms:conformsTo | |
| + | dcterms:created | |
|   | dcterms:extent |  |
|   | dcterms:hasFormat | |
|   | dcterms:hasPart | |
|   | dcterms:hasVersion | |
|   | dcterms:isFormatOf | |
| + | dcterms:isPartOf | |
|   | dcterms:isReferencedBy | |
|   | dcterms:isReplacedBy | |
|   | dcterms:isRequiredBy | |
| + | dcterms:issued | |
|   | dcterms:isVersionOf | |
|   | dcterms:medium | |
|   | dcterms:provenance | |
|   | dcterms:references | |
|   | dcterms:requires | |
| ⭕ | dcterms:spatial | |
|   | dcterms:tableOfContents | |
| ⭕ | dcterms:temporal | |
|   | edm:currentLocation | |
|   | edm:hasMet | |
|   | edm:hasType | |
|   | edm:incorporates | |
|   | edm:isDerivativeOf | |
| + | edm:isNextInSequence | |
|   | edm:isRelatedTo | |
|   | edm:isRepresentationOf | |
|   | edm:isSimilarTo | |
|   | edm:isSuccessorOf | |
|   | edm:realizes | |
| ✔ | edm:type | |
|   | owl:sameAs | |


## Properties for ore:Aggregation
| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| ✔ | edm:aggregatedCHO |
| ✔ edm:dataProvider |
| | edm:hasView |
| t | edm:isShownAt |
| t | edm:isShownBy |
| + | edm:object |
| ✔ | edm:provider |
| | dc:rights |
| ✔ | edm:rights |
| | edm:ugc |
| + | edm:intermediateProvider |

### Properties for edm:WebResource

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| | dc:creator |
| | dc:description |
| | dc:format |
| | dc:rights |
| | dc:source |
| | dcterms:conformsTo |
| | dcterms:created |
| | dcterms:extent |
| | dcterms:hasPart |
| | dcterms:isFormatOf |
| | dcterms:isPartOf |
| | dcterms:isReferencedBy |
| | dcterms:issued |
| | edm:isNextInSequence |
| + | edm:rights |
| | owl:sameAs |

## Contextual Classes

### Properties for edm:Agent

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| + | skos:prefLabel |
| + | skos:altLabel |
|  | skos:note |
|  | dc:date |
|  | dc:identifier |
|  | dcterms:hasPart |
|  | dcterms:isPartOf |
|  | edm:begin |
|  | edm:end |
|  | edm:hasMet |
|  | edm:isRelatedTo |
|  | foaf:name |
|  | rdaGr2:biographicalInformation |
| + | rdaGr2:dateOfBirth |
| + | rdaGr2:dateOfDeath |
|  | rdaGr2:dateOfEstablishment |
|  | rdaGr2:dateOfTermination |
|  | rdaGr2:gender |
|  | rdaGr2:placeOfBirth |
|  | rdaGr2:placeOfDeath |
|  | rdaGr2:professionOrOccupation |
|  | owl:sameAs |

### Properties for edm:Place

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| + | wgs84_pos:lat |
| + | wgs84_pos:long |	
| | wgs84_pos:alt |
| + | skos:prefLabel |
| | skos:altLabel |
| | skos:note |
| | dcterms:hasPart |
| | dcterms:isPartOf |
| | edm:isNextInSequence |	
| | owl:sameAs |


### Properties for edm:TimeSpan

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| + | skos:prefLabel |
| | skos:altLabel |
| | skos:note |
| | dcterms:hasPart	|
| | dcterms:isPartOf |	
| + | edm:begin |
| + | edm:end |
| | edm:isNextInSequence |
| | owl:sameAs |	


### Properties for skos:Concept

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| + | skos:prefLabel |
| + | skos:altLabel |
| | skos:broader |
| | skos:narrower |	
| | skos:related |
| | skos:broadMatch |	
| | skos:narrowMatch |
| | skos:relatedMatch |
| | skos:exactMatch |
| | skos:closeMatch |
| | skos:note |
| | skos:notation |	
| | skos:inScheme |

### Properties for cc:License

| Пометка поля | Название поля | Соответствие полю реестра |
| ------------ | ------------- | ------------------------- |
| ✔ | odrl:inheritFrom | |
| | cc:deprecatedOn | |

