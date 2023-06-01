# Publication Manifest Experiments

The [experiments folder](https://github.com/w3c/pub-manifest/tree/master/experiments) lists various initiatives (example files, books, publications, etc.) that have been undertaken by the Working Group as part of the development of the [Publication Manifest specification](https://www.w3.org/TR/pub-manifest/). These experiments, by their nature, may become obsolete as the final specification evolves, but are retained here nevertheless.

## Proofs of Concept

### Publication Manifest

- [Embedded Manifest](https://github.com/w3c/pub-manifest/tree/master/experiments/manifest_script) — Demonstrates an example of a manifest embedded in a `script` tag.
- [HTML with JSON-LD - No Manifest](https://github.com/w3c/pub-manifest/tree/master/experiments/html-schema-org-json-ld) — An alternative to the  Publication manifest, this example demonstrates a basic HTML page with only schema.org metadata. (Obsolete)
- [Linked Manifest](https://github.com/w3c/pub-manifest/tree/master/experiments/separate_manifest) — Demonstrates a Publication where the manifest is stored in a separate JSON file and linked to from the entry page.
- [Minimal and Full Manifest](https://github.com/w3c/pub-manifest/tree/master/experiments/w3c_rec) — Demonstrates both the bare minimal set of manifest metadata required by the Publication manifest and a more expansive record.

## Processing Tools

- [Table of Contents Generator](https://github.com/w3c/tree/master/experiments/toc_generator) — Demonstrates how an HTML `nav` can be processed by user agents to extract the table of contents. This tool can also be [tested live](https://w3c.github.io/pub-manifest/experiments/toc_generator/).
- [EPUB Package Document to Publication Manifest XSLT](https://github.com/w3c/pub-manifest/tree/master/experiments/epub_package_xslt) - Converts an EPUB 3 Package Document to the publication manifest format.
- [Manifest to Internal Representation Processor #1](https://w3c.github.io/pub-manifest/experiments/manifest-to-internal-processor/index.html) - Converts a publication manifest to a JSON view of the internal representation. A version that [processes a linked manifest](https://w3c.github.io/pub-manifest/experiments/manifest-to-internal-processor/linked.html) is also available.
- [Manifest to Internal Representation Processor #2](https://github.com/iherman/PubManifest) - a Typescript processor to convert the publication manifest to an internal representation. There is also an [online tool](https://iherman.github.io/PubManifest/webview/index.html) running the processor, displaying the data structure in Yaml. (The package als have a command line interface.) The Web interface does not (yet?) implements the handling of an embedded or linked manifest from a PEP (the CLI base version does).
- [Publication Manifest Validator](https://w3c.github.io/pub-manifest/experiments/schema-validator/) - An online validator using the JSON schemas.
