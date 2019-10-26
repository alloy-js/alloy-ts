export class AlloySource {

    private readonly _filename: string;
    private readonly _source: string;

    /**
     * Create a new source by extracting the Alloy source code from an XML
     * element.
     *
     * @param filename The source filename
     * @param source The source code
     */
    constructor (filename: string, source: string) {

        this._filename = filename;
        this._source = source;

    }

    /**
     * Return the full file path this source comes from.
     */
    filename (): string {

        return this._filename;

    }

    /**
     * Return the Alloy source code.
     */
    source (): string {

        return this._source;

    }

    /**
     * Create a new source by extracting the Alloy source code from an XML
     * element.
     *
     * @param element The XML element containing a "filename" attribute and a
     * "content" attribute.
     */
    static fromElement (element: Element): AlloySource {

        let filename: string | null = element.getAttribute('filename');
        let source: string | null = element.getAttribute('content');

        if (!filename) throw Error('No filename attribute in XML file');
        if (!source) throw Error('No source attribute in XML file');

        return new AlloySource(filename, source);

    }

}
