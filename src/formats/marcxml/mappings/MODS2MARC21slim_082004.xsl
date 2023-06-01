<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xlink="http://www.w3.org/TR/xlink" xmlns:mods="http://www.loc.gov/mods/" xmlns="http://www.loc.gov/MARC21/slim" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" exclude-result-prefixes="mods xlink">
	<xsl:include href="MARC21slimUtils.xsl"/>
	<xsl:output method="xml" indent="yes"/>

	<xsl:template match="/">
			<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="mods:modsCollection">
		<collection>
			<xsl:apply-templates/>
		</collection>
	</xsl:template>

	<xsl:template match="mods:targetAudience/mods:listValue" mode="ctrl008">
		<xsl:choose>
		<xsl:when test=".='adolescent'">d</xsl:when>
		<xsl:when test=".='adult'">e</xsl:when>
		<xsl:when test=".='general'">g</xsl:when>
		<xsl:when test=".='juvenile'">j</xsl:when>
		<xsl:when test=".='preschool'">a</xsl:when>
		<xsl:when test=".='specialized'">f</xsl:when>
		<xsl:otherwise><xsl:text>|</xsl:text></xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="mods:typeOfResource" mode="leader">
		<xsl:choose>
			<xsl:when test="text()='text' and @manuscript='yes'">t</xsl:when>
			<xsl:when test="text()='text'">a</xsl:when>
			<xsl:when test="text()='cartographic' and @manuscript='yes'">f</xsl:when>
			<xsl:when test="text()='cartographic'">e</xsl:when>
			<xsl:when test="text()='notated music' and @manuscript='yes'">d</xsl:when>
			<xsl:when test="text()='notated music'">c</xsl:when>
			<xsl:when test="text()='sound recording'">j</xsl:when>
			<xsl:when test="text()='still image'">k</xsl:when>
			<xsl:when test="text()='moving image'">g</xsl:when>
			<xsl:when test="text()='three dimensional object'">r</xsl:when>
			<xsl:when test="text()='software, multimedia'">m</xsl:when>
			<xsl:when test="text()='mixed material'">p</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="mods:typeOfResource" mode="ctrl008">
		<xsl:choose>
			<xsl:when test="text()='text' and @manuscript='yes'">BK</xsl:when>
			<xsl:when test="text()='text'">
			<xsl:choose> 
				<xsl:when test="../mods:originInfo/mods:issuance='monographic'">BK</xsl:when>
				<xsl:when test="../mods:originInfo/mods:issuance='continuing'">SE</xsl:when>
			</xsl:choose>
			</xsl:when>
			<xsl:when test="text()='cartographic' and @manuscript='yes'">MP</xsl:when>
			<xsl:when test="text()='cartographic'">MP</xsl:when>
			<xsl:when test="text()='notated music' and @manuscript='yes'">MU</xsl:when>
			<xsl:when test="text()='notated music'">MU</xsl:when>
			<xsl:when test="text()='sound recording'">MU</xsl:when>
			<xsl:when test="text()='still image'">VM</xsl:when>
			<xsl:when test="text()='moving image'">VM</xsl:when>
			<xsl:when test="text()='three dimensional object'">VM</xsl:when>
			<xsl:when test="text()='software, multimedia'">CF</xsl:when>
			<xsl:when test="text()='mixed material'">MM</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="controlField008-24-27">
		<xsl:variable name="chars">
			<xsl:for-each select="mods:genre[@authority='marc']">
				<xsl:choose>
					<xsl:when test=".='abstract of summary'">a</xsl:when>
					<xsl:when test=".='bibliography'">b</xsl:when>
					<xsl:when test=".='catalog'">c</xsl:when>
					<xsl:when test=".='dictionary'">d</xsl:when>
					<xsl:when test=".='directory'">r</xsl:when>
					<xsl:when test=".='discography'">k</xsl:when>
					<xsl:when test=".='encyclopedia'">e</xsl:when>
					<xsl:when test=".='filmography'">q</xsl:when>
					<xsl:when test=".='handbook'">f</xsl:when>
					<xsl:when test=".='index'">i</xsl:when>
					<xsl:when test=".='law report or digest'">w</xsl:when>
					<xsl:when test=".='legal article'">g</xsl:when>
					<xsl:when test=".='legal case and case notes'">v</xsl:when>
					<xsl:when test=".='legislation'">l</xsl:when>
					<xsl:when test=".='patent'">j</xsl:when>
					<xsl:when test=".='programmed text'">p</xsl:when>
					<xsl:when test=".='review'">o</xsl:when>
					<xsl:when test=".='statistics'">s</xsl:when>
					<xsl:when test=".='survey of literature'">n</xsl:when>
					<xsl:when test=".='technical report'">t</xsl:when>
					<xsl:when test=".='theses'">m</xsl:when>
					<xsl:when test=".='treaty'">z</xsl:when>
				</xsl:choose>
			</xsl:for-each>
		</xsl:variable>
		<xsl:call-template name="makeSize">
			<xsl:with-param name="string" select="$chars"/>
			<xsl:with-param name="length" select="4"/>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="controlField008-30-31">
		<xsl:variable name="chars">
			<xsl:for-each select="mods:genre[@authority='marc']">
				<xsl:choose>
					<xsl:when test=".='biography'">b</xsl:when>
					<xsl:when test=".='conference publication'">c</xsl:when>
					<xsl:when test=".='drama'">d</xsl:when>
					<xsl:when test=".='essay'">e</xsl:when>
					<xsl:when test=".='fiction'">f</xsl:when>
					<xsl:when test=".='folktale'">o</xsl:when>
					<xsl:when test=".='history'">h</xsl:when>
					<xsl:when test=".='humor, satire'">k</xsl:when>
					<xsl:when test=".='instruction'">i</xsl:when>
					<xsl:when test=".='interview'">t</xsl:when>
					<xsl:when test=".='language instruction'">j</xsl:when>
					<xsl:when test=".='memoir'">m</xsl:when>
					<xsl:when test=".='rehersal'">r</xsl:when>
					<xsl:when test=".='reporting'">g</xsl:when>
					<xsl:when test=".='sound'">s</xsl:when>
					<xsl:when test=".='speech'">l</xsl:when>
				</xsl:choose>
			</xsl:for-each>
		</xsl:variable>
		<xsl:call-template name="makeSize">
			<xsl:with-param name="string" select="$chars"/>
			<xsl:with-param name="length" select="2"/>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="makeSize">
		<xsl:param name="string"/>
		<xsl:param name="length"/>
		<xsl:variable name="nstring" select="normalize-space($string)"/>
		<xsl:variable name="nstringlength" select="string-length($nstring)"/>
		<xsl:choose>
			<xsl:when test="$nstringlength&gt;$length">
				<xsl:value-of select="substring($nstring,1,$length)"/>
			</xsl:when>
			<xsl:when test="$nstringlength&lt;$length">
				<xsl:value-of select="$nstring"/>
				<xsl:call-template name="buildSpaces">
					<xsl:with-param name="spaces" select="$length - $nstringlength"/>
					<xsl:with-param name="char">|</xsl:with-param>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$nstring"/>
			</xsl:otherwise>
		</xsl:choose>		
	</xsl:template>

	<xsl:template match="mods:mods">
		<record>
			<leader>
				<!-- 00-04 -->
				<xsl:text>     </xsl:text>
				<!-- 05 -->
				<xsl:text>n</xsl:text>
				<!-- 06 -->
				<xsl:apply-templates mode="leader" select="mods:typeOfResource[1]"/>
				<!-- 07 -->
				<xsl:choose>
					<xsl:when test="mods:originInfo/mods:issuance='monographic'">m</xsl:when>
					<xsl:when test="mods:originInfo/mods:issuance='continuing'">s</xsl:when>
					<xsl:when test="mods:typeOfResource/@collection='yes'">c</xsl:when>
					<xsl:otherwise>m</xsl:otherwise>
				</xsl:choose>
				<!-- 08 -->
				<xsl:text> </xsl:text>
				<!-- 09 -->
				<xsl:text> </xsl:text>
				<!-- 10 -->
				<xsl:text>2</xsl:text>
				<!-- 11 -->
				<xsl:text>2</xsl:text>
				<!-- 12-16 -->
				<xsl:text>     </xsl:text>
				<!-- 17 -->
				<xsl:text>u</xsl:text>
				<!-- 18 -->
				<xsl:text>u</xsl:text>
				<!-- 19 -->
				<xsl:text> </xsl:text>
				<!-- 20-23 -->
				<xsl:text>4500</xsl:text>
			</leader>
			<xsl:if test="mods:genre[@authority='marc']='atlas'">
				<controlfield tag="007">ad||||||</controlfield>
			</xsl:if>
			<xsl:if test="mods:genre[@authority='marc']='model'">
				<controlfield tag="007">aq||||||</controlfield>
			</xsl:if>
			<xsl:if test="mods:genre[@authority='marc']='remote sensing image'">
				<controlfield tag="007">ar||||||</controlfield>
			</xsl:if>
			<xsl:if test="mods:genre[@authority='marc']='map'">
				<controlfield tag="007">aj||||||</controlfield>
			</xsl:if>
			<xsl:if test="mods:genre[@authority='marc']='globe'">
				<controlfield tag="007">d|||||</controlfield>
			</xsl:if>


			<controlfield tag="008">
				<xsl:variable name="typeOf008"><xsl:apply-templates mode="ctrl008" select="mods:typeOfResource"/></xsl:variable>
				<!-- 00-05 -->	
				<xsl:choose>
				<xsl:when test="mods:recordInfo/mods:recordContentSource[@encoding='marc']">
					<xsl:value-of select="mods:recordInfo/mods:recordContentSource[@encoding='marc']"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>      </xsl:text>
				</xsl:otherwise>
				</xsl:choose>
				<!-- 06 -->	
				<xsl:choose>
					<xsl:when test="mods:originInfo/mods:issuance='monographic' and count(mods:originInfo/mods:dateIssued)=1">s</xsl:when>
					<xsl:when test="mods:originInfo/mods:issuance='monographic' and mods:originInfo/mods:dateIssued[@point='start'] and mods:originInfo/mods:dateIssued[@point='end']">m</xsl:when>
					<xsl:when test="mods:originInfo/mods:issuance='continuing' and mods:originInfo/mods:dateIssued[@point='end' and @encoding='marc']='9999'">c</xsl:when>
					<xsl:when test="mods:originInfo/mods:issuance='continuing' and mods:originInfo/mods:dateIssued[@point='end' and @encoding='marc']='uuuu'">u</xsl:when>
					<xsl:when test="mods:originInfo/mods:issuance='continuing' and mods:originInfo/mods:dateIssued[@point='end' and @encoding='marc']">d</xsl:when>
					<xsl:when test="not(mods:originInfo/mods:issuance) and mods:originInfo/mods:dateIssued">s</xsl:when>
					<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 07-14 -->	
				<xsl:choose>
					<xsl:when test="mods:originInfo/mods:dateIssued[@point='start' and @encoding='marc']">
						<xsl:value-of select="mods:originInfo/mods:dateIssued[@point='start' and @encoding='marc']"/>
					</xsl:when>
					<xsl:when test="mods:originInfo/mods:dateIssued[@encoding='marc']">
						<xsl:value-of select="mods:originInfo/mods:dateIssued[@encoding='marc']"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>    </xsl:text>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="mods:originInfo/mods:dateIssued[@point='end' and @encoding='marc']">
						<xsl:value-of select="mods:originInfo/mods:dateIssued[@point='end' and @encoding='marc']"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>    </xsl:text>
					</xsl:otherwise>
				</xsl:choose>
				<!-- 15-17 -->	
				<xsl:choose>
				<xsl:when test="mods:originInfo/mods:place/mods:code[@authority='marc']">
					<xsl:value-of select="mods:originInfo/mods:place/marc:code[@authority='marc']"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>   </xsl:text>
				</xsl:otherwise>
				</xsl:choose>
				<!-- 18-20 -->	
				<xsl:text>|||</xsl:text>
				<!-- 21 -->
				<xsl:choose>
					<xsl:when test="$typeOf008='SE'">
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='database'">d</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='loose-leaf'">l</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='newspaper'">n</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='periodical'">p</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='series'">m</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='web site'">w</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 22 -->	
				<xsl:apply-templates mode="ctrl008" select="targetAudience/listValue"/>
				<!-- 23 -->	
				<xsl:choose>
				<xsl:when test="$typeOf008='BK' or $typeOf008='MU' or $typeOf008='SE' or $typeOf008='MM'">
					<xsl:choose>
					<xsl:when test="mods:physicalDescription/mods:form='braille'">f</xsl:when>
					<xsl:when test="mods:physicalDescription/mods:form='electronic'">s</xsl:when>
					<xsl:when test="mods:physicalDescription/mods:form='microfiche'">b</xsl:when>
					<xsl:when test="mods:physicalDescription/mods:form='microfilm'">a</xsl:when>
					<xsl:when test="mods:physicalDescription/mods:form='print'"><xsl:text> </xsl:text></xsl:when>
					<xsl:otherwise>|</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 24-27 -->	
				<xsl:choose>
					<xsl:when test="$typeOf008='BK'">
						<xsl:call-template name="controlField008-24-27"/>
					</xsl:when>
					<xsl:when test="$typeOf008='MP'">
						<xsl:text>|</xsl:text>
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='atlas'">e</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='globe'">d</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
						<xsl:text>||</xsl:text>
					</xsl:when>
					<xsl:when test="$typeOf008='CF'">
						<xsl:text>||</xsl:text>
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='database'">e</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='font'">f</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='game'">g</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='numerical data'">a</xsl:when>
							<xsl:when test="mods:genre[@authority='marc']='sound'">h</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
						<xsl:text>|</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>||||</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
				<!-- 28 -->					
				<xsl:text>|</xsl:text>
				<!-- 29 -->
				<xsl:choose>
					<xsl:when test="$typeOf008='BK' or $typeOf008='SE'">
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='conference publication'">1</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:when test="$typeOf008='MP' or $typeOf008='VM'">
						<xsl:choose>
						<xsl:when test="mods:physicalDescription/mods:form='braille'">f</xsl:when>
						<xsl:when test="mods:physicalDescription/mods:form='electronic'">m</xsl:when>
						<xsl:when test="mods:physicalDescription/mods:form='microfiche'">b</xsl:when>
						<xsl:when test="mods:physicalDescription/mods:form='microfilm'">a</xsl:when>
						<xsl:when test="mods:physicalDescription/mods:form='print'"><xsl:text> </xsl:text></xsl:when>
						<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>					
					<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 30-31 -->
				<xsl:choose>
					<xsl:when test="$typeOf008='MU'">
						<xsl:call-template name="controlField008-30-31"/>
					</xsl:when>
					<xsl:when test="$typeOf008='BK'">
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='festschrift'">1</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
						<xsl:text>|</xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:text>||</xsl:text>
					</xsl:otherwise>
				</xsl:choose>
				<!-- 32 -->					
				<xsl:text>|</xsl:text>
				<!-- 33 -->
				<xsl:choose>
					<xsl:when test="$typeOf008='VM'">
						<xsl:choose>
						<xsl:when test="mods:genre[@authority='marc']='art originial'">a</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='art reproduction'">c</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='chart'">n</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='diorama'">d</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='filmstrip'">f</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='flash card'">o</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='graphic'">k</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='kit'">b</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='technical drawing'">l</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='slide'">s</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='realia'">r</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='picture'">i</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='motion picture'">m</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='model'">q</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='microscope slide'">p</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='toy'">w</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='transparency'">t</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='videorecording'">v</xsl:when>
						<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:when test="$typeOf008='BK'">
						<xsl:choose>
						<xsl:when test="mods:genre[@authority='marc']='comic strip'">c</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='fiction'">1</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='essay'">e</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='drama'">d</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='humor, satire'">h</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='letter'">i</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='novel'">f</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='short story'">j</xsl:when>
						<xsl:when test="mods:genre[@authority='marc']='speech'">s</xsl:when>
						<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 34 -->	
				<xsl:choose>
					<xsl:when test="$typeOf008='BK'">
						<xsl:choose>
							<xsl:when test="mods:genre[@authority='marc']='biography'">d</xsl:when>
							<xsl:otherwise>|</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:otherwise>|</xsl:otherwise>
				</xsl:choose>
				<!-- 35-37 -->	
				<xsl:choose>
				<xsl:when test="mods:language[@authority='iso639-2b']">
					<xsl:value-of select="mods:language[@authority='iso639-2b']"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>|||</xsl:text>
				</xsl:otherwise>
				</xsl:choose>
			</controlfield>
			<xsl:apply-templates/>
		</record>
	</xsl:template>

	<xsl:template match="*"/>

	<xsl:template match="mods:language[@authority='iso639-2b']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">041</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>
	
	<xsl:template match="mods:language[@authority='rfc3066']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">041</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="ind2">7</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
				<subfield code='2'>rfc3066</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:targetAudience">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="mods:targetAudience/mods:otherValue">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">521</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:physicalDescription">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="mods:physicalDescription/mods:extent">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">300</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>


	<xsl:template match="mods:note">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">
				<xsl:choose>
					<xsl:when test="@type='performers'">511</xsl:when>
					<xsl:when test="@type='venue'">518</xsl:when>
					<xsl:otherwise>500</xsl:otherwise>
				</xsl:choose>
			</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
				<xsl:for-each select="@xlink:href">
					<subfield code='u'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:note[@type='statement of responsiblity']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">245</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='c'>
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:accessCondition">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">
			<xsl:choose>
				<xsl:when test="@type='restrictionOnAccess'">506</xsl:when>
				<xsl:when test="@type='useAndReproduction'">540</xsl:when>
			</xsl:choose>
			</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:recordInfo">
		<xsl:for-each select="mods:recordIdentifier">
			<controlfield tag="001"><xsl:value-of select="."/></controlfield>
			<xsl:for-each select="@source">
				<controlfield tag="003"><xsl:value-of select="."/></controlfield>			
			</xsl:for-each>
		</xsl:for-each>
		<xsl:for-each select="mods:recordChangeDate[@encoding='iso8601']">
			<controlfield tag="005"><xsl:value-of select="."/></controlfield>
		</xsl:for-each>
		<xsl:for-each select="mods:recordContentSource">
			<xsl:call-template name="datafield">
			<xsl:with-param name="tag">040</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
			</xsl:call-template>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="mods:genre[@authority!='marc' or not(@authority)]">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">655</xsl:with-param>
			<xsl:with-param name="ind2">7</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code='a'>
					<xsl:value-of select="."/>
				</subfield>
				<xsl:for-each select="@authority">
					<subfield code='2'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>


	<xsl:template match="mods:originInfo">
		<xsl:for-each select="mods:placeCode[@authority='iso3166']">
			<xsl:call-template name="datafield">
				<xsl:with-param name="tag">044</xsl:with-param>
				<xsl:with-param name="subfields">
					<subfield code='c'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:for-each>

		<xsl:for-each select="mods:edition">
			<xsl:call-template name="datafield">
				<xsl:with-param name="tag">250</xsl:with-param>
				<xsl:with-param name="subfields">
					<subfield code='a'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:for-each>

		<xsl:for-each select="mods:frequency">
			<xsl:call-template name="datafield">
				<xsl:with-param name="tag">310</xsl:with-param>
				<xsl:with-param name="subfields">
					<subfield code='a'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:for-each>
		
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">260</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:for-each select="mods:place">
					<subfield code='a'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:publisher">
					<subfield code='b'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:dateIssued">
					<subfield code='c'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:dateCreated">
					<subfield code='g'>
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:titleInfo[@type='abbreviated']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">210</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="titleInfo"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:titleInfo[@type='translated']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">242</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="ind2" select="string-length(mods:nonSort)"/>
			<xsl:with-param name="subfields">
				<xsl:call-template name="titleInfo"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:titleInfo[@type='alternative']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">246</xsl:with-param>
			<xsl:with-param name="ind1">3</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="titleInfo"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:titleInfo[@type='uniform']">
		<xsl:choose>
		<xsl:when test="mods:name/mods:role/mods:text='creator'">
			<xsl:call-template name="datafield">
				<xsl:with-param name="tag">240</xsl:with-param>
				<xsl:with-param name="ind1">1</xsl:with-param>
				<xsl:with-param name="ind2" select="string-length(mods:nonSort)"/>
				<xsl:with-param name="subfields">
					<xsl:call-template name="titleInfo"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:call-template name="datafield">
				<xsl:with-param name="tag">130</xsl:with-param>
				<xsl:with-param name="ind1" select="string-length(mods:nonSort)"/>
				<xsl:with-param name="subfields">
					<xsl:call-template name="titleInfo"/>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="mods:titleInfo">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">245</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="ind2" select="string-length(mods:nonSort)"/>
			<xsl:with-param name="subfields">
				<xsl:call-template name="titleInfo"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:abstract">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">520</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
				<xsl:for-each select="@xlink:href">
					<subfield code="u">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:tableOfContents">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">505</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
				<xsl:for-each select="@xlink:href">
					<subfield code="u">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:subject">
		<xsl:apply-templates/>
	</xsl:template>

	<xsl:template match="mods:subject/mods:heirarchialGeographic">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">630</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:for-each select="mods:country">
					<subfield code="a">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:state">
					<subfield code="b">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:county">
					<subfield code="c">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:city">
					<subfield code="d">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:subject/mods:cartographics">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">255</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:for-each select="mods:coordinates">
					<subfield code="c">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:scale">
					<subfield code="a">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:projection">
					<subfield code="b">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="titleInfo">
		<xsl:for-each select="mods:title">
			<subfield code="a">
				<xsl:value-of select="../mods:nonSort"/><xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:subtitle">
			<subfield code="b">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:partNumber">
			<subfield code="n">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:partName">
			<subfield code="p">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='lcc']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">050</xsl:with-param>
			<xsl:with-param name="ind2">
				<xsl:choose>
				<xsl:when test="../mods:recordInfo/mods:recordContentSource='DLC' or ../mods:recordInfo/mods:recordContentSource='Library of Congress'">0</xsl:when>
				<xsl:otherwise>2</xsl:otherwise>
				</xsl:choose>
			</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='ddc']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">082</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
				<xsl:for-each select="@edition">
					<subfield code="2">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='udc']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">080</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='nlm']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">060</xsl:with-param>
			<xsl:with-param name="ind2">4</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='sudocs']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">086</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:classification[@authority='candocs']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">086</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='doi']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">856</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="u">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='isbn']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">020</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='isrc']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">024</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='ismn']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">024</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='issn']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">022</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='issue number']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">028</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='lccn']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">010</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='matrix number']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">028</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='music publisher']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">028</xsl:with-param>
			<xsl:with-param name="ind1">3</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='music plate']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">028</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='sici']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">024</xsl:with-param>
			<xsl:with-param name="ind1">4</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='uri']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">856</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="u">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='upc']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">024</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:identifier[@type='videorecording']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">028</xsl:with-param>
			<xsl:with-param name="ind1">4</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:name">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">720</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart"/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='personal'][mods:role/mods:text='creator']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">100</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart"/>
				</subfield>
				<xsl:for-each select="mods:namePart[@type='date']">
					<subfield code="d">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:role/mods:text">
					<subfield code="e">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:affiliation">
					<subfield code="u">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:description">
					<subfield code="g">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='corporate'][mods:role/mods:text='creator']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">110</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart[1]"/>
				</subfield>
				<xsl:for-each select="mods:namePart[position()>1]">
					<subfield code="b">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:role/mods:text">
					<subfield code="e">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:description">
					<subfield code="g">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='conference'][mods:role/mods:text='creator']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">111</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart[1]"/>
				</subfield>
				<xsl:for-each select="mods:role/mods:code">
					<subfield code="4">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='personal'][mods:role/mods:text!='creator' or not(mods:role)]">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">700</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart"/>
				</subfield>
				<xsl:for-each select="mods:namePart[@type='date']">
					<subfield code="d">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:role/mods:text">
					<subfield code="e">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:affiliation">
					<subfield code="u">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='corporate'][mods:role/mods:text!='creator' or not(mods:role)]">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">710</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart[2]"/>
				</subfield>
				<xsl:for-each select="mods:namePart[position()>1]">
					<subfield code="b">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:role/mods:text">
					<subfield code="e">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
				<xsl:for-each select="mods:description">
					<subfield code="g">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:name[@type='conference'][mods:role/mods:text!='creator' or not(mods:role)]">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">711</xsl:with-param>
			<xsl:with-param name="ind1">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="mods:namePart[1]"/>
				</subfield>
				<xsl:for-each select="mods:role/mods:code">
					<subfield code="4">
						<xsl:value-of select="."/>
					</subfield>
				</xsl:for-each>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template name="authorityInd">
		<xsl:choose>
			<xsl:when test="@authority='lcsh'">0</xsl:when>
			<xsl:when test="@authority='lcshac'">1</xsl:when>
			<xsl:when test="@authority='mesh'">2</xsl:when>
			<xsl:when test="@authority='csh'">3</xsl:when>
			<xsl:when test="@authority='nal'">5</xsl:when>
			<xsl:when test="@authority='rvm'">6</xsl:when>
			<xsl:when test="@authority">7</xsl:when>
		</xsl:choose>
	</xsl:template>

	<xsl:template match="mods:subject[local-name(*[1])='topic']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">650</xsl:with-param>
			<xsl:with-param name="ind1">1</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="*[1]"/>
				</subfield>
				<xsl:apply-templates select="*[position()>1]"/>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:subject[local-name(*[1])='title']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">630</xsl:with-param>
			<xsl:with-param name="ind1"><xsl:value-of select="string-length(mods:nonSort)"/></xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="titleInfo"/>
				<xsl:apply-templates select="*[position()>1]"/>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:subject[local-name(*[1])='name']">
		<xsl:for-each select="*[1]">
			<xsl:choose>
			<xsl:when test="@type='personal'">
				<xsl:call-template name="datafield">
					<xsl:with-param name="tag">600</xsl:with-param>
					<xsl:with-param name="ind1">1</xsl:with-param>
					<xsl:with-param name="ind2"><xsl:call-template name="authorityInd"/></xsl:with-param>
					<xsl:with-param name="subfields">
						<subfield code="a">
							<xsl:value-of select="mods:namePart"/>
						</subfield>
						<xsl:for-each select="mods:namePart[@type='date']">
							<subfield code="a">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:for-each select="mods:role/mods:text">
							<subfield code="e">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:for-each select="mods:affiliation">
							<subfield code="u">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:apply-templates select="*[position()>1]"/>
					</xsl:with-param>
				</xsl:call-template>	
			</xsl:when>
			<xsl:when test="@type='corporate'">
				<xsl:call-template name="datafield">
					<xsl:with-param name="tag">610</xsl:with-param>
					<xsl:with-param name="ind1">2</xsl:with-param>
					<xsl:with-param name="ind2"><xsl:call-template name="authorityInd"/></xsl:with-param>
					<xsl:with-param name="subfields">
						<subfield code="a">
							<xsl:value-of select="mods:namePart"/>
						</subfield>
						<xsl:for-each select="mods:namePart[position()>1]">
							<subfield code="a">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:for-each select="mods:role/mods:text">
							<subfield code="e">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:apply-templates select="*[position()>1]"/>
					</xsl:with-param>
				</xsl:call-template>	
			</xsl:when>
			<xsl:when test="@type='conference'">
				<xsl:call-template name="datafield">
					<xsl:with-param name="tag">611</xsl:with-param>
					<xsl:with-param name="ind1">2</xsl:with-param>
					<xsl:with-param name="ind2"><xsl:call-template name="authorityInd"/></xsl:with-param>
					<xsl:with-param name="subfields">
						<subfield code="a">
							<xsl:value-of select="mods:namePart"/>
						</subfield>
						<xsl:for-each select="mods:role/mods:code">
							<subfield code="4">
								<xsl:value-of select="."/>
							</subfield>
						</xsl:for-each>
						<xsl:apply-templates select="*[position()>1]"/>
					</xsl:with-param>
				</xsl:call-template>	
			</xsl:when>
			</xsl:choose>
		</xsl:for-each>
	</xsl:template>

	<xsl:template match="mods:subject[local-name(*[1])='geographic']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">651</xsl:with-param>
			<xsl:with-param name="ind2"><xsl:call-template name="authorityInd"/></xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="*[1]"/>
				</subfield>
				<xsl:apply-templates select="*[position()>1]"/>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:subject[local-name(*[1])='temporal']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">650</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="*[1]"/>
				</subfield>
				<xsl:apply-templates select="*[position()>1]"/>
			</xsl:with-param>
		</xsl:call-template>	
	</xsl:template>

	<xsl:template match="mods:subject/mods:topic">
		<subfield code="x">
			<xsl:value-of select="."/>
		</subfield>
	</xsl:template>
	
	<xsl:template match="mods:subject/mods:temporal">
		<subfield code="y">
			<xsl:value-of select="."/>
		</subfield>
	</xsl:template>

	<xsl:template match="mods:subject/mods:geographic">
		<subfield code="z">
			<xsl:value-of select="."/>
		</subfield>
	</xsl:template>
	
	<xsl:template match="mods:location">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">852</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>		
	</xsl:template>

	<xsl:template match="mods:extension">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">887</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="a">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>		
	</xsl:template>


	<xsl:template match="mods:relatedItem/mods:internetMediaType">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">856</xsl:with-param>
			<xsl:with-param name="ind2">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="q">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>		
	</xsl:template>

	<xsl:template match="mods:relatedItem/mods:identifier[@type='uri']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">856</xsl:with-param>
			<xsl:with-param name="ind2">2</xsl:with-param>
			<xsl:with-param name="subfields">
				<subfield code="u">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:with-param>
		</xsl:call-template>		
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='series']">
	</xsl:template>

	<xsl:template match="mods:relatedItem[not(@type)]">
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='preceding']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">780</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='succeeding']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">785</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="ind2">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='otherFormat']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">776</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='original']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">534</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='host']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">773</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='constituent']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">774</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template match="mods:relatedItem[@type='related']">
		<xsl:call-template name="datafield">
			<xsl:with-param name="tag">787</xsl:with-param>
			<xsl:with-param name="ind1">0</xsl:with-param>
			<xsl:with-param name="subfields">
				<xsl:call-template name="relatedItem7XX"/>
			</xsl:with-param>
		</xsl:call-template>
	</xsl:template>

	<xsl:template name="relatedItem7XX">
		<xsl:for-each select="mods:titleInfo">
			<xsl:for-each select="mods:title">
				<subfield code="t">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:for-each>	
			<xsl:for-each select="mods:partNumber">
				<subfield code="g">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:for-each>	
			<xsl:for-each select="mods:partName">
				<subfield code="g">
					<xsl:value-of select="."/>
				</subfield>
			</xsl:for-each>	
		</xsl:for-each>
		<xsl:for-each select="mods:physicalDescription/mods:extent">
			<subfield code="h">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:identifier[not(@type)]">
			<subfield code="o">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:identifier[@type='issn']">
			<subfield code="x">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:identifier[@type='isbn']">
			<subfield code="z">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:identifier[@type='local']">
			<subfield code="w">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
		<xsl:for-each select="mods:note">
			<subfield code="n">
				<xsl:value-of select="."/>
			</subfield>
		</xsl:for-each>
	</xsl:template>

		<xsl:variable name="leader06">
			<xsl:choose>
				<xsl:when test="mods:typeOfResource='text'">
					<xsl:choose>
						<xsl:when test="@manuscript='yes'">t</xsl:when>
						<xsl:otherwise>a</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="mods:typeOfResource='cartographic'">
					<xsl:choose>
						<xsl:when test="@manuscript='yes'">f</xsl:when>
						<xsl:otherwise>e</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="mods:typeOfResource='notated music'">
					<xsl:choose>
						<xsl:when test="@manuscript='yes'">d</xsl:when>
						<xsl:otherwise>c</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:when test="mods:typeOfResource='sound recording'">j</xsl:when>
				<xsl:when test="mods:typeOfResource='still image'">k</xsl:when>
				<xsl:when test="mods:typeOfResource='moving image'">g</xsl:when>
				<xsl:when test="mods:typeOfResource='three dimensional object'">r</xsl:when>
				<xsl:when test="mods:typeOfResource='software, multimedia'">m</xsl:when>
				<xsl:when test="mods:typeOfResource='mixed material'">p</xsl:when>
			</xsl:choose>
		</xsl:variable>

</xsl:stylesheet><!-- Stylus Studio meta-information - (c)1998-2003 eXcelon Corp.
<metaInformation>
<scenarios ><scenario default="no" name="Rebecca MODS" userelativepaths="yes" externalpreview="no" url="..\xml\mods\rebeccamods.xml" htmlbaseurl="" outputurl="" processortype="internal" commandline="" additionalpath="" additionalclasspath="" postprocessortype="none" postprocesscommandline="" postprocessadditionalpath="" postprocessgeneratedext=""/><scenario default="yes" name="Scenario1" userelativepaths="yes" externalpreview="no" url="..\ifla\bushmods.xml" htmlbaseurl="" outputurl="" processortype="internal" commandline="" additionalpath="" additionalclasspath="" postprocessortype="none" postprocesscommandline="" postprocessadditionalpath="" postprocessgeneratedext=""/><scenario default="no" name="Scenario2" userelativepaths="yes" externalpreview="no" url="..\xml\mods\rebeccamods.xml" htmlbaseurl="" outputurl="" processortype="saxon" commandline="" additionalpath="" additionalclasspath="" postprocessortype="none" postprocesscommandline="" postprocessadditionalpath="" postprocessgeneratedext=""/></scenarios><MapperInfo srcSchemaPath="" srcSchemaRoot="" srcSchemaPathIsRelative="yes" srcSchemaInterpretAsXML="no" destSchemaPath="" destSchemaRoot="" destSchemaPathIsRelative="yes" destSchemaInterpretAsXML="no"/>
</metaInformation>
-->