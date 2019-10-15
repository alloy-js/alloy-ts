export class AlloySource {

    private readonly _filename: string;
    private readonly _source: string;

    /**
     * Create a new source by extracting the Alloy source code from an XML
     * element.
     *
     * @param element The "source" element from an Alloy XML file
     */
    constructor (element: Element) {

        let filename: string | null = element.getAttribute('filename');
        let source: string | null = element.getAttribute('content');

        if (!filename) throw Error('No filename attribute in XML file');
        if (!source) throw Error('No source attribute in XML file');

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

}
