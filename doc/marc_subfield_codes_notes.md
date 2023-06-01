# MARC21 

## Subfield Codes

-   $w - Bibliographic record control number|Record control number

    System control number of the related bibliographic record preceded by the MARC code, enclosed in parentheses, for the agency to which the control number applies. See MARC Code List for Organizations for a listing of sources used in MARC 21 records.
    
    800 1#$aNegt, Oskar$tSchriften.$vBd. 2$w(DE-101b)967682460

-   $0

    Authority record control number|Authority record control number or standard number|Record control number
    
    Subfield $0 contains the system control number of the related authority or classification record, or a standard identifier such as an International Standard Name Identifier (ISNI). These identifiers may be in the form of text or a Uniform Resource Identifier (URI). If the identifier is text, the control number or identifier is preceded by the appropriate MARC Organization code (for a related authority record) or the Standard Identifier source code (for a standard identifier scheme), enclosed in parentheses. When the identifier is given in the form of a Web retrieval protocol, e.g., HTTP URI, no preceding parenthetical is used.
    
    Subfield $0 may contain a URI that identifies a name or label for an entity. When dereferenced, the URI points to information describing that name. A URI that directly identifies the entity itself is contained in subfield $1.
    
    See MARC Code List for Organizations for a listing of organization codes and Standard Identifier Source Codes for code systems for standard identifiers. Subfield $0 is repeatable for different control numbers or identifiers.
    
    - 100 1#$aBach, Johann Sebastian.$4aut$0(DE-101c)310008891
    - 100 1#$aTrollope, Anthony,$d1815-1882.$0(isni)0000000121358464
    - 710 2#$aCalifornia Poets in the Schools (Project),$eissuing body,$epublisher.$0http://id.loc.gov/authorities/names/n85319780$1http://id.loc.gov/rwo/agents/n85319780

-   $5 - Institution to which field applies
    
    MARC code of the institution or organization that holds the copy to which the data in the field applies. Data in the field may not apply to the universal description of the item or may apply universally to the item but be of interest only to the location cited.

-   $1 - Real World Object URI
  
    Subfield $1 contains a URI that identifies an entity, sometimes referred to as a Thing, a Real World Object or RWO, whether actual or conceptual. When dereferenced, the URI points to a description of that entity. A URI that identifies a name or label for an entity is contained in $0.

-   $6 - Linkage
      Data that links fields that are different script representations of each other. Subfield $6 may contain the tag number of an associated field, an occurrence number, a code that identifies the first script encountered in a left-to-right scan of the field, and an indication that the orientation for a display of the field data is right-to-left. A regular (non-880) field may be linked to one or more 880 fields that all contain different script representations of the same data. Subfield $6 is structured as follows:
      $6 [linking tag]-[occurrence number]/[script identification code]/[field orientation code]
      Subfield $6 is always the first subfield in the field.
      Descriptions of multiscript record models, with examples, are in Multiscript Records; specifications for field 880 are under that field; specifications for character sets and repertoires for scripts are found in MARC 21 Specifications for Record Structure, Character Sets, and Exchange Media.
      Linking tag and occurrence number - Linking tag part contains the tag number of the associated field. This part is followed immediately by a hyphen and the two-digit occurrence number part. A different occurrence number is assigned to each set of associated fields within a single record. The function of an occurrence number is to permit the matching of the associated fields (not to sequence the fields within the record). An occurrence number may be assigned at random for each set of associated fields. An occurrence number of less than two digits is right justified and the unused position contains a zero.
        100 1#$6880-01$a[Heading in Latin script]
        880 1#$6100-01/(N$a[Heading in Cyrillic script]
        245 10$6880-03$aSosei to kako :$bNihon Sosei Kako Gakkai shi.
        880 10$6245-03/$1$a[Title in Japanese script] :$b[Subtitle on Japanese script] .
      [Primary script is Latin; alternate script is Japanese]
        100 1#$6880-01$a[Name in Chinese script] .
        880 1#$6100-01/(B$aShen, Wei-pin.
      [Primary script is Chinese; alternate script is Latin]
      When there is no associated field to which a field 880 is linked, the occurrence number in subfield$6 is 00. It is used if an agency wants to separate scripts in a record (see Multiscript Records). The linking tag part of subfield $6 will contain the tag that the associated regular field would have had if it had existed in the record.
    
      880 ##$6530-00/(2/r$a[Additional physical form available information in Hebrew script]
      [Field 880 is not linked to an associated field. The occurrence number is 00.]

-   $8 - Field link and sequence number

    Identifies linked fields and may also propose a sequence for the linked fields. Subfield $8 may be repeated to link a field to more than one other group of fields. The structure and syntax for the field link and sequence number subfield is:
  
    $8 [linking number].[sequence number]\[field link type]
  
    Please note that subfield $8 is defined differently in field 852 where it is used to sequence related holdings records. Please see the description of field 852, subfield $8 in the MARC 21 Format for Holdings Data for more information.
  
    Linking number is the first data element in the subfield and required if the subfield is used. It is a variable-length whole number that occurs in subfield $8 in all fields that are to be linked. Fields with the same linking number are considered linked.
  
    Sequence number is separated from the linking number by a period "." and is optional. It is a variable- length whole number that may be used to indicate the relative order for display of the linked fields (lower sequence numbers displaying before higher ones). If it is used it must occur in all $8 subfields containing the same linking number.
  
    Field link type is separated from preceding data by a reverse slash "\". It is a code indicating the reason for the link and it follows the link number, or sequence number if present. Field link type is required except when $8 is used to link and sequence 85X-87X holdings fields. The following one-character field link type codes have been defined in MARC for use in subfield $8:
    
    -   a - Action
    
        Links one or more fields with another field to which the processing or reference actions relate. This code is typically used only when there is more than one 5XX that relate to another 5XX field.

        -   541 ##$81.1\a$3Public School and College Authority and Trade School and Junior College Authority project files$aFinance Dept.$cTransferred
        -   583 ##$81.2\a$aAppraised$c198712-$ltjb/prr
        -   583 ##$81.3\a$aScheduled$c19880127$ksrc/prr
        -   583 ##$81.4\a$aArranged$c19900619$kmc/dmj
        -   583 ##$81.5\a$aProcessed level 2$b90.160$c19901218$kmc/dmj

-   c - Constituent item
  
    Used in a record for a collection, or a single item consisting of identifiable constituent units, to link the fields relating to the constituent units. All other non-linked data elements in the record pertain to the collection or item as a whole.

      - 245 10$aBrevard Music Center$nProgram #24$h[sound recording].
      - 505 0#$aFrom my window / Siegmesiter (world premiere) - Don Giovanni. Il mio tesorof [i.e. tesoro] / Mozart - Martha. M’appari / Flotow - Turandot. Nessun dorma / Puccini - Pines of Rome / Respighi.
      - 650 #0$81\c$aSuites (Orchestra), Arranged.
      - 650 #0$82\c$83\c$84\c$aOperas$xExcerpts.
      - 650 #0$85\c$aSymphonic poems.
      - 700 1#$82\c$84\c$aDi Giuseppe, Enrico,$d1938-$4prf
      - 700 12$81\c$aSiegmeister, Elie$d1909-$tFrom my window;$oarr.
      - 700 12$82\c$aMozart, Wolfgang Amadeus,$d1756-1791.$tDon Giovanni.$pMio tesoro.
      - 700 12$83\c$aFlotow, Friedrich von,$d1812-1883.$tMartha.$pAch! So fromm, ach! so traut.$lItalian
      - 700 12$84\c$aPuccini, Giacomo,$d1858-1924.$tTurandot.$pNessun dorma.
      - 700 12$85\c$aRespighi, Ottorino$d1879-1936.$tPini di Roma.
    
-   p - Metadata provenance

    Used in a record to link a field with another field containing information about provenance of the metadata recorded in the linked field.
    
      - 082 04$81\p$a004$222/ger$qDE-101
      - 883 0#$81\p$aparallelrecordcopy$d20120101$x20141231$qNO-OsNB

-   r - Reproduction

    Used in a record for a reproduction to identify fields linked because they contain information concerning only the reproduction. Other descriptive information in the record pertains to the original (with the exception of field 007 (Physical Description Fixed Field), 008 (Fixed-Length Data Elements: Books, Music, Serials, or Mixed Material) position 23 (Form of item), field 245 subfield $h (Title Statement / Medium), and field 533 (Reproduction Note)).

    ```    
    007/00 h
    <microform>
    008/23 a
    <Microfilm>
    ```

      - 245 04$aThe New-York mirror, and ladies' literary gazette$h[microform]
      - 533 ##$aMicrofilm$bAnn Arbor, Mich. :$cUniversity Microfilms,$d1950.$e3 microfilm reels ; 35 mm.$f(American periodical series, 1800-1850 : 164-165, 785)
      - 830 #0$84\r$aAmerican periodical series, 1800-1850 ;$v164-165, 785.

-   u - General linking, type unspecified

    Used in cases when a specific link type is not appropriate. Code “u” may serve as a default value when there is no information about the reason for the link available.
    
      - 082 04$81\u$a779.994346228092$qDE-101$222/ger
      - 085 ##$81\u$b779
      - 085 ##$81\u$s704.949
      - 085 ##$81\u$s943
      - 085 ##$81\u$z1$s092
      - 085 ##$81\u$z2$s4346228
      - 245 10$a-Der- Bodensee$b= Lake Constance$cHolger Spierling ; mit Texten von Iris Lemanczyk ; Übersetzung: Global-Text, Heidelberg, Timothy Gilfoid

-   x - General sequencing

    Used in a record to make a link between fields to show a sequence between them. The sequence could be one that orders the pieces of a long field that has been broken up, indicates the relative importance of fields within the sequence, or is used for some other sequencing purpose. Use of the sequence number in $8 is required when this code is used.
    
      - 505 00$81.1\x$tThree articles reviewing Hoeffding's work.$tWassily Hoeffding's Work in the Sixties /$rKobus Oosterhoff and Willem van Zwet.$tThe Impact of Wassily Hoeffding's Work on Sequential Analysis /$rGordon Simons.$tThe Impact of Wassily Hoeffding's Research on Nonparametrics /$rPranab Kumar Sen ...
      - 505 80$81.2\x$tThe role of assumptions in statistical decisions.$tDistinguishability of sets of distributions. (The case of independent and identically distributed random variables) /$rWassily Hoeffding and J. Wolfowitz ...
      - 505 80$81.3\x$tUnbiased range-preserving estimators.$tRange preserving unbiased estimators in the multinomial case.$tAsymptotic normality.$tHajek's projection lemma.

    [This example shows a long 505 field broken up into smaller pieces]
