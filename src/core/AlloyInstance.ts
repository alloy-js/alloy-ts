import { AlloyAtom } from './AlloyAtom';
import { AlloyField } from './AlloyField';
import { AlloySignature } from './AlloySignature';
import { AlloySkolem } from './AlloySkolem';
import { AlloySource } from './AlloySource';
import { AlloyTuple } from './AlloyTuple';

export class AlloyInstance {

    private _bitwidth: number = 0;
    private _builddate: Date = new Date(0);
    private _command: string = '';
    private _filename: string = '';
    private _maxseq: number = 0;
    private _sources: Array<AlloySource> = [];

    private _signatures: Array<AlloySignature>;
    private _fields: Array<AlloyField>;
    private _skolems: Array<AlloySkolem>;

    private _xml: AlloySource;

    /**
     * Assemble an Alloy instance from an XML document.
     *
     * @remarks
     * Extracts and parses all info from an instance that has been exported
     * from Alloy in XML format. The plain text read from the XML file is passed
     * to the constructor; all XML parsing is performed automatically.
     *
     * @param text The text from an Alloy XML file.
     */
    constructor (text: string) {

        let parser = new DOMParser();
        let document = parser.parseFromString(text, 'application/xml');

        this._parseAlloyAttributes(document.querySelector('alloy'));
        this._parseInstanceAttributes(document.querySelector('instance'));
        this._parseSourceCode(Array.from(document.querySelectorAll('source')));

        let sigElements = Array.from(document.querySelectorAll('sig'));
        let fldElements = Array.from(document.querySelectorAll('field'));
        let skoElements = Array.from(document.querySelectorAll('skolem'));

        let sigs: Map<number, AlloySignature> = AlloySignature
            .buildSigs(this._bitwidth, this._maxseq, sigElements);

        let fields: Map<number, AlloyField> = AlloyField
            .buildFields(fldElements, sigs);

        let skolems: Map<number, AlloySkolem> = AlloySkolem
            .buildSkolem(skoElements, sigs, fields);

        AlloySignature.assignFields(Array.from(fields.values()));

        this._signatures = Array.from(sigs.values());
        this._fields = Array.from(fields.values());
        this._skolems = Array.from(skolems.values());

        this._xml = new AlloySource('XML', text);

    }

    /**
     * Return an array of all atoms in this instance.
     */
    atoms (): Array<AlloyAtom> {

        return this.signatures()
            .filter(sig => !sig.isSubset())
            .map(sig => sig.atoms())
            .reduce((acc, cur) => acc.concat(cur), []);

    }

    /**
     * Return the bitwidth of this instance.
     */
    bidwidth (): number {

        return this._bitwidth;

    }

    /**
     * Return this build date of Alloy that generated this instance.
     */
    builddate (): Date {

        return new Date(this._builddate.getTime());

    }

    /**
     * Return the command used to generate this instance.
     */
    command (): string {

        return this._command;

    }

    /**
     * Find a field by name.
     *
     * @remarks
     * In Alloy it is possible to have multiple fields with same name that are
     * defined within different signatures. If there are multiple fields of the
     * same name, this ambiguity must be removed by providing the signature used
     * to define the field you require. You may provide this signature by name
     * or object as the second argument, or you may use the dot syntax in the
     * first argument (e.g. Signature.fieldname).
     *
     * @param name The field name with or without the signature name included using dot syntax
     * @param sig The [[AlloySignature|signature]] name or object used to determine specific
     * field to be used when names are ambiguous
     */
    field (name: string, sig?: string | AlloySignature): AlloyField | null | never {

        let tokens = name.split('.');

        if (tokens.length === 2) {

            if (arguments.length !== 1)
                throw Error('Do not use dot syntax and provide a signature');

            sig = tokens[0];
            name = tokens[1];

        } else if (tokens.length !== 1) {

            throw Error('Provided dot syntax is invalid');

        } else {

            name = tokens[0];

        }

        let fields = this.fields().filter(fld => fld.name() === name);

        if (fields.length === 0) return null;

        if (fields.length === 1) return fields[0];

        if (!sig) {
            let list = fields
                .map(fld => fld.types()[0].name() + ' <: ' + name)
                .join('\n');
            throw Error('The name is ambiguous due to multiple matches:\n' + list);
        }

        const signature = typeof sig === 'string'
            ? this.signature(sig)
            : sig;

        if (signature === null) return null;

        return fields.find(fld => fld.types()[0] === signature) || null;

    }

    /**
     * Return an array of all fields in this instance.
     */
    fields (): Array<AlloyField> {

        return this._fields.slice();

    }

    /**
     * Return the full path of the file that was used to generate this instance.
     */
    filename (): string {

        return this._filename;

    }

    /**
     * Return the maximum sequence length.
     */
    maxseq (): number {

        return this._maxseq;

    }

    /**
     * Find a signature by name. If the signature does not exist, null is returned.
     * @param name The name of the signature (the "this/" prefix is not required
     * but may be included)
     */
    signature (name: string): AlloySignature | null {

        return this._signatures.find(sig => sig.name() === name) ||
            this._signatures.find(sig => sig.name() === 'this/' + name) ||
            null;

    }

    /**
     * Return an array of all signatures in this instance.
     */
    signatures (): Array<AlloySignature> {

        return this._signatures.slice();

    }

    /**
     * Return an array of all skolems in this instance.
     */
    skolems (): Array<AlloySkolem> {

        return this._skolems.slice();

    }

    /**
     * Return an array of all Alloy source files that define the model from
     * which this instance was created.
     */
    sources (): Array<AlloySource> {

        return this._sources.slice();

    }

    /**
     * Return an array of all tuples in this instance.
     *
     * @param includeSkolem If true, skolem tuples will be included, if false,
     * they will not be included.
     */
    tuples (includeSkolem: boolean = false): Array<AlloyTuple> {

        let skolems = includeSkolem
            ? this.skolems()
                .map(skolem => skolem.tuples())
                .reduce((acc, cur) => acc.concat(cur), [])
            : [];

        let fields = this.fields()
            .map(field => field.tuples())
            .reduce((acc, cur) => acc.concat(cur), []);

        return fields.concat(skolems);

    }

    /**
     * Returns the "univ" signature, of which all other signatures are children.
     * If no "univ" signature is present, returns undefined.
     */
    univ (): AlloySignature | undefined {

        return this._signatures.find(s => s.name() === 'univ');

    }

    /**
     * Return the XML file that was used to construct this instance. The
     * filename of the returned [[AlloySource]] will be "XML".
     */
    xml (): AlloySource {

        return this._xml;

    }

    /**
     * Parse the attributes of the "alloy" XML element
     *
     * @remarks
     * This method sets the [[_builddate]] property.
     *
     * @param element The "alloy" XML element
     * @throws Error if element is null or does not have a builddate attribute.
     * @private
     */
    private _parseAlloyAttributes (element: Element | null) {

        if (!element) throw Error('Instance does not contain Alloy info');

        let builddate = element.getAttribute('builddate');
        if (!builddate) throw Error('Instance does not contain an Alloy build date');
        this._builddate = new Date(Date.parse(builddate));

    }

    /**
     * Parse the attributes of the "instance" XML element
     *
     * @remarks
     * This method sets the [[_bitwidth]], [[_maxseq]], [[_command]], and
     * [[_filename]] properties.
     *
     * @param element The "instance" XML element
     * @throws Error if element is null or any of bitwidth, maxseq, command, or
     * filename attributes are not present.
     * @private
     */
    private _parseInstanceAttributes (element: Element | null) {

        if (!element) throw Error('Instance does not contain attribute info');

        let bitwidth = element.getAttribute('bitwidth');
        if (!bitwidth) throw Error('Instance does not contain a bit width');
        this._setBitWidth(parseInt(bitwidth));

        let maxseq = element.getAttribute('maxseq');
        if (!maxseq) throw Error('Instance does not contain a max seq');
        this._setMaxSeq(parseInt(maxseq));

        let command = element.getAttribute('command');
        if (!command) throw Error('Instance does not contain a command');
        this._setCommand(command);

        let filename = element.getAttribute('filename');
        if (!filename) throw Error('Instance does not contain a filename');
        this._setFilename(filename);

    }

    /**
     * Parse the "source" XML elements, retrieving all source code used to
     * create this instance.
     *
     * @param elements The array our "source" elements
     * @private
     */
    private _parseSourceCode (elements: Array<Element>) {

        this._sources = elements.map(element => AlloySource.fromElement(element));

    }

    /**
     * Set the [[_bitwidth]] attribute
     * @param bitwidth The bitwidth
     * @private
     */
    private _setBitWidth (bitwidth: number) {

        this._bitwidth = bitwidth;

    }

    /**
     * Set the [[_command]] attribute
     * @param command The command
     * @private
     */
    private _setCommand (command: string) {

        this._command = command;

    }

    /**
     * Set the [[_filename]] attribute
     * @param filename The filename
     * @private
     */
    private _setFilename (filename: string) {

        this._filename = filename;

    }

    /**
     * Set the [[_maxseq]] attribute
     * @param maxseq The max seq length
     * @private
     */
    private _setMaxSeq (maxseq: number) {

        this._maxseq = maxseq;

    }

}
