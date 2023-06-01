<?xml version="1.0" encoding="UTF-8"?>
<!-- switch ONIX tagnames for ONIX 3.0, XSLT 1.1 -->
<!-- version 1.1, modified to deal with XHTML markup -->
<!-- version 1.2, modified to deal with xmlns attribute in root element -->
<xsl:stylesheet version="1.1" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
	<xsl:param name="result-document" required="yes"/>
	<xsl:param name="dtd-path" select="''"/>
	<xsl:variable name="release" select="/*/@release"/>
	<xsl:variable name="target">
		<xsl:choose>
			<!-- xsl:when test="/ONIXMessage">short</xsl:when -->
			<xsl:when test="local-name(/*)='ONIXMessage'">short</xsl:when>
			<xsl:otherwise>reference</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:template match="/">
		<xsl:choose>
			<xsl:when test="not($dtd-path='')">
				<xsl:document href="{$result-document}" method="xml" doctype-system="{$dtd-path}">
					<xsl:apply-templates/>
				</xsl:document>
			</xsl:when>
			<xsl:otherwise>
				<xsl:document href="{$result-document}" method="xml">
					<xsl:apply-templates/>
				</xsl:document>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="*">
		<xsl:variable name="target-name">
			<xsl:choose>
				<xsl:when test="$target='short' and not(@shortname)">
					<xsl:value-of select="name()"/>
				</xsl:when>
				<xsl:when test="$target='short'">
					<xsl:value-of select="@shortname"/>
				</xsl:when>
				<xsl:when test="not(@refname)">
					<xsl:value-of select="name()"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="@refname"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:element name="{$target-name}">
			<xsl:copy-of select="@*[not(name()='refname' or name()='shortname')]"/>
			<xsl:apply-templates select="*|text()"/>
		</xsl:element>
	</xsl:template>
	<xsl:template match="text()">
		<xsl:copy/>
	</xsl:template>
</xsl:stylesheet>
