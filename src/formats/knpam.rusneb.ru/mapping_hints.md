## Titles


[BibFrame2 ontology list view](https://id.loc.gov/ontologies/bibframe.html)

| | |
| --- | --- |
| __Class__: | `Title` |
| __Definition__: | Title information relating to a resource: work title, preferred title, instance title, transcribed title, translated title, variant form of title, etc. |
| __Label__: | Title entity |
| __URI__: | http://id.loc.gov/ontologies/bibframe/Title |

__Used With__:

*   | | |
    | --- | --- |
    | Property: | title |      
    | __Expected Value__: | Title |
    | __Label__: | Title resource |
    | __Definition__: | Name given to a resource. |
    | __Used__ with: | Used with Work, Instance or Item |
    | __URI__: | http://id.loc.gov/ontologies/bibframe/title |
    | __Change Notes__: | 2016-04-21 (New) |

__SubClassed As:__: 

*   | | |
    | --- | --- |
    | __Class__: | `VariantTitle` |
    | __Label__: | Title variation |
    | __Definition__: | Title associated with the resource that is different from the Work or Instance title. |
    | __URI__: | http://id.loc.gov/ontologies/bibframe/VariantTitle |
    
    __SubClassed As__:
    
    *   | | |
        | --- | --- |
        | __Class__: | `KeyTitle` |
        | __Label__: | Key title |
        | __Definition__: | Unique title for a continuing resource that is assigned by the ISSN International Center in conjunction with an ISSN. |
        | __URI__: | __ | http__://id.loc.gov/ontologies/bibframe/KeyTitle |
        | Change  | __Notes__: | 2016-04-21 (New) |

        __SubClassed As__:
        
        *   | | |
            | --- | --- |
            | __Class__: | `AbbreviatedTitle` |
            | __Label__: | Abbreviated title |
            | __Definition__: | Title as abbreviated for citation, indexing, and/or identification. |
            | __URI__: | http://id.loc.gov/ontologies/bibframe/AbbreviatedTitle |
            | __Change Notes__: | 2016-04-21 (New) |

        *   | | |
            | --- | --- |
            | __Class__: | `ParallelTitle` |
            | __Label__: | Parallel title proper |
            | __Definition__: | Title in another language and/or script. |
            | __URI__: | http://id.loc.gov/ontologies/bibframe/ParallelTitle |
            | __Change Notes__: | 2016-04-21 (New) |

        *   | | |
            | --- | --- |
            | __Class__: | `CollectiveTitle` |
            | __Label__: | Collective title |
            | __http__: | //id.loc.gov/ontologies/bibframe/CollectiveTitle |
            | __Definition__: | Title for a compilation of resources. |
            | __Change Notes__: | 2016-04-21 (New) | 



## Title information

[BibFrame2 ontology class view](https://id.loc.gov/ontologies/bibframe-category.html)

Title Information
Property	Subproperty of	Label / Description	Used With	Expected Value
title		Title resource / Name given to a resource.	Work, Instance or Item	Title
mainTitle		Main title / Title being addressed. Possible title component.	Title	Literal
subtitle		Subtitle / Word, character, or group of words and/or characters that contains the remainder of the title after the main title. Possible title component.	Title	Literal
partNumber		Part number / Part or section enumeration of a title. Possible title component.	Title	Literal
partName		Part title / Part or section name of a title. Possible title component.	Title	Literal
variantType		Variant title type / Type of title variation, e.g., acronym, cover, spine, earlier, later, series version.	VariantTitle	Literal
