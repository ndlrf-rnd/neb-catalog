<?xml version="1.0" encoding="UTF-8"?>
<!-- switch ONIX tagnames for ONIX 3.0 Acknowledgement, XSLT 2.0 -->
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
	<xsl:param name="result-document" required="yes"/>
	<xsl:param name="dtd-path" select="''"/>
	<xsl:variable name="release" select="/*/@release"/>
	<xsl:variable name="target">
		<xsl:choose>
			<xsl:when test="local-name(/*)='ONIXMessageAcknowledgement'">short</xsl:when>
			<xsl:otherwise>reference</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:template match="/">
		<xsl:choose>
			<xsl:when test="not($dtd-path='')">
				<xsl:result-document href="{$result-document}" method="xml" doctype-system="{$dtd-path}">
					<xsl:apply-templates/>
				</xsl:result-document>
			</xsl:when>
			<xsl:otherwise>
				<xsl:result-document href="{$result-document}" method="xml">
					<xsl:apply-templates/>
				</xsl:result-document>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="*">
		<xsl:variable name="target-name">
			<xsl:choose>
				<xsl:when test="($target='short') and not(@shortname)">
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
