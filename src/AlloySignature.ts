import { AlloyElement } from './AlloyElement';
import { AlloyAtom } from './AlloyAtom';
import {
    filter_exclude_labels,
    IDSig,
    is_subset,
    subset_sort, subset_type_id
} from './AlloyXML';
import { AlloyField } from './AlloyField';

/**
 * A signature in an Alloy instance.
 *
 * @remarks
 * In Alloy, a signature introduces a set of atoms.
 */
export class AlloySignature extends AlloyElement {

    /**
     * This signature's parent type
     */
    private _type: AlloySignature | null;

    /**
     * An array of signatures for which this is the parent type
     */
    private _subtypes: Array<AlloySignature>;

    /**
     * An array of [[AlloyAtom|atoms]] defined by this signature
     */
    private _atoms: Array<AlloyAtom>;

    /**
     * An array of [[AlloyField|fields]] defined by this signature
     */
    private _fields: Array<AlloyField>;

    private readonly _is_builtin: boolean;
    private readonly _is_meta: boolean;
    private readonly _is_one: boolean;
    private readonly _is_private: boolean;
    private readonly _is_subset: boolean;

    /**
     * Create a new Alloy signature.
     * @param name The name of this signature
     * @param is_builtin Is this a built-in signature?
     * @param is_meta Is this a meta signature?
     * @param is_one Is this a singleton signature?
     * @param is_private Is this a private signature?
     * @param is_subset Is this a subset signature?
     */
    constructor (name: string,
                 is_builtin?: boolean,
                 is_meta?: boolean,
                 is_one?: boolean,
                 is_private?: boolean,
                 is_subset?: boolean) {

        super(name);

        this._type = null;
        this._subtypes = [];
        this._atoms = [];
        this._fields = [];

        this._is_builtin = is_builtin ? is_builtin : false;
        this._is_meta = is_meta ? is_meta : false;
        this._is_one = is_one ? is_one : false;
        this._is_private = is_private ? is_private : false;
        this._is_subset = is_subset ? is_subset : false;

    }

    /**
     * Returns an array of atoms whose type are this signature.
     *
     * @remarks
     * To return a list of atoms defined directly by this signature, omit the
     * optional nest parameter. To include atoms defined by this signature
     * and all subtypes of this signature, pass in a truthy value for the
     * nest parameter.
     *
     * @param nest Whether or not to recursively include atoms
     */
    atoms (nest?: boolean): Array<AlloyAtom> {

        return nest
            ? this.atoms()
                .concat(this.subTypes(true)
                    .reduce((acc, cur) => acc.concat(cur.atoms()), [] as AlloyAtom[])
                )
            : this._atoms.slice();
    }

    /**
     * Returns the depth of this signature within the signature hierarchy. The
     * root signature (typically univ) has depth zero.
     */
    depth (): number {

        return this.typeHierarchy().length - 1;

    }

    /**
     * Invokes the specified function for this signature and each descendant
     * signature in [breadth-first order](https://en.wikipedia.org/wiki/Breadth-first_search), such that a given signature is only
     * visited if all signatures of lesser depth have already been visited. The
     * specified function is passed the current signature.
     *
     * @param callback The function to call for each signature
     * @returns This signature is returned, allowing for method chaining.
     */
    each (callback: (signature: AlloySignature) => any): AlloySignature {

        let sig: AlloySignature | undefined = this,
            current: AlloySignature[],
            next: AlloySignature[] = [sig],
            children: AlloySignature[],
            i: number,
            n: number;

        do {
            current = next.reverse();
            next = [];
            while (!!(sig = current.pop())) {
                callback(sig);
                children = sig.subTypes();
                if (children) {
                    for (i=0, n=children.length; i<n; ++i) {
                        next.push(children[i]);
                    }
                }
            }
        } while (next.length);

        return this;

    }

    /**
     * Invokes the specified function for this signature and each descendant
     * signature in [post-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Post-order), such that a given signature is only
     * visited after all of its descendants have already been visited. The
     * specified function is passed the current signature.
     *
     * @param callback The function to call for each signature
     * @returns This signature is returned, allowing for method chaining.
     */
    eachAfter (callback: (signature: AlloySignature) => any): AlloySignature {

        this._subtypes.forEach(child => {
            child.eachAfter(callback);
        });
        callback(this);

        return this;

    }

    /**
     * Invokes the specified function for this signature and each descendant
     * signature in [pre-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order), such that a given signature is only
     * visited after all of its ancestors have already been visited. The
     * specified function is passed the current signature.
     *
     * @remarks
     * As an example, to print the nested signature hierarchy:
     * ```javascript
     * let univ = ...; // retreive the univ signature
     * univ.eachBefore(sig => {
     *   console.log(' '.repeat(sig.depth()) + sig.name());
     * }
     * ```
     *
     * @param callback The function to call for each signature
     * @returns This signature is returned, allowing for method chaining.
     */
    eachBefore (callback: (signature: AlloySignature) => any): AlloySignature {

        callback(this);
        this._subtypes.forEach(child => {
            child.eachBefore(callback);
        });

        return this;

    }

    /**
     * Returns the string `signature`.
     */
    expressionType (): string {

        return 'signature';

    }

    /**
     * Returns an array of fields that are declared by this signature.
     *
     * @remarks
     * In Alloy, a field is defined within a signature block. In doing so, the
     * first column on that field is established to have the type of that
     * signature.
     */
    fields (): Array<AlloyField> {

        return this._fields.slice();

    }

    /**
     * Returns the atom with the given name if it exists, otherwise null.
     *
     * @remarks
     * This method searches this signature as well as all descendant signatures
     * for the give atom using a breadth-first search algorithm.
     *
     * @param name The name of the atom
     */
    findAtom (name: string): AlloyAtom|null {

        let sig: AlloySignature | undefined = this,
            current: AlloySignature[],
            next: AlloySignature[] = [sig],
            children: AlloySignature[],
            i: number,
            n: number,
            atom: AlloyAtom|undefined;

        do {
            current = next.reverse();
            next = [];
            while (!!(sig = current.pop())) {
                atom = sig._atoms.find(atom => atom.name() === name);
                if (atom) return atom;
                children = sig.subTypes();
                if (children) {
                    for (i=0, n=children.length; i<n; ++i) {
                        next.push(children[i]);
                    }
                }
            }
        } while (next.length);

        return null;

    }

    /**
     * Return the unique ID of this signature.
     *
     * @remarks
     * The unique ID of a signature is a combination of all signature names,
     * starting with the highest level parent and ending with this one, of all
     * signatures in this signature's ancenstry.
     */
    id (): string {

        return this.name();

    }

    /**
     * Returns true if this is a builtin signature, false otherwise.
     *
     * @remarks
     * Builtin signatures include "univ", "int", "seq/int", "string".
     */
    isBuiltin (): boolean {

        return this._is_builtin;

    }

    /**
     * Returns true if this is a meta signature, false otherwise.
     */
    isMeta (): boolean {

        return this._is_meta;

    }

    /**
     * Returns true if this is a singleton signature, false otherwise.
     */
    isOne (): boolean {

        return this._is_one;

    }

    /**
     * Returns true if this is a private signature, false otherwise.
     */
    isPrivate (): boolean {

        return this._is_private;

    }

    /**
     * Returns true if this is a subset signature, false otherwise.
     */
    isSubset (): boolean {

        return this._is_subset;

    }

    /**
     * Returns an array of signatures that are subtypes of this signature.
     *
     * @remarks
     * To return a list of immediate subtypes, omit the optional nest parameter.
     * To include all subtypes of this signature, including all of those that
     * are below this one in the inheritance tree, pass in a truthy value for
     * the nest parameter.
     *
     * @param nest Whether or not to recursively include subtypes
     */
    subTypes (nest?: boolean): Array<AlloySignature> {

        return nest
            ? this.subTypes()
                .concat(this._subtypes
                    .map(sig => sig.subTypes(true))
                    .reduce((acc, cur) => acc.concat(cur), [])
                )
            : this._subtypes.slice();

    }

    /**
     * Returns a printable string.
     */
    toString (): string {

        return this.name();

    }

    /**
     * Return a array, in order from highest to lowest, of this signature's
     * ancestors.
     *
     * @remarks
     * The final element of the list will be this signature.
     */
    typeHierarchy (): Array<AlloySignature> {

        let hierarchy = this._type ? this._type.typeHierarchy() : [];
        hierarchy.push(this);
        return hierarchy;

    }

    /**
     * Assign all fields in the given list to their respective parent signatures.
     *
     * @param fields The list of fields.
     */
    static assignFields (fields: Array<AlloyField>) {

        fields.forEach(field => {

            field.parent()._fields.push(field);

        });

    }

    /**
     * Build all signatures in an XML Alloy instance.
     *
     * @param bitwidth The bitwidth, which defines the number of integers
     * @param maxseq The maximum sequence length
     * @param sigs An array of "sig" elements from the XML file
     */
    static buildSigs (bitwidth: number, maxseq: number, sigs: Array<Element>): Map<number, AlloySignature> {

        let ids: Map<number, AlloySignature> = new Map();
        let parents: Map<number, number> = new Map();

        // Int and seq/Int don't actually include atoms in the XML file,
        // so they need to be assembled separately from the rest of the sigs.
        let intElement: Element | undefined = sigs.find(el => el.getAttribute('label') === 'Int');
        let seqElement: Element | undefined = sigs.find(el => el.getAttribute('label') === 'seq/Int');

        if (!intElement) throw Error('No Int signature found in XML');
        if (!seqElement) throw Error('No seq/Int signature found in XML');

        let int = AlloySignature._buildInt(bitwidth, intElement);
        let seq = AlloySignature._buildSeq(maxseq, seqElement, int.sig);

        ids.set(int.id, int.sig);
        ids.set(seq.id, seq.sig);

        // Parse the non-subset signatures
        sigs
            .filter(filter_exclude_labels('Int', 'seq/Int'))
            .filter(el => !is_subset(el))
            .forEach(el => {
                let sig = AlloySignature._buildSig(el);
                ids.set(sig.id, sig.sig);
                if (sig.parentID) parents.set(sig.id, sig.parentID);
            });

        sigs
            .filter(el => is_subset(el))
            .sort(subset_sort)
            .forEach(el => {
                let sig = AlloySignature._buildSub(el, ids);
                ids.set(sig.id, sig.sig);
                if (sig.parentID) parents.set(sig.id, sig.parentID);
            });

        parents.forEach((parentID: number, sigID: number) => {

            let parent: AlloySignature | undefined = ids.get(parentID);
            let sig: AlloySignature | undefined = ids.get(sigID);

            if (!parent || !sig) throw Error('Error parsing parents');

            sig._type = parent;
            parent._subtypes.push(sig);

        });

        return ids;

    }

    /**
     * Assemble the builtin Int signature.
     *
     * @remarks
     * The total number of integers will be equal to 2<sup>bitwidth</sup>, and
     * the values will fall into the range
     * [-2<sup>bitwidth</sup>/2, 2<sup>bitwidth</sup>/2].
     *
     * @param bitwidth The bitwidth
     * @param element The XML sig element with the "Int" label attribute
     * @private
     */
    private static _buildInt (bitwidth: number, element: Element): IDSig {

        if (!element) throw Error('Instance contains no Int element');
        if (bitwidth < 1) throw Error(`Invalid bitwidth ${bitwidth}`);

        let id = element.getAttribute('ID');
        if (!id) throw Error('Invalid Int element');

        let int = new AlloySignature('Int', true);

        let n = 2**bitwidth;
        for (let i=-n/2; i<n/2; ++i) {
            int._atoms.push(new AlloyAtom(int, i.toString()));
        }

        return {
            id: parseInt(id),
            sig: int
        }

    }

    /**
     * Assemble the builtin seq/Int signature.
     *
     * @param maxseq The maximum sequence length
     * @param element The XML sig element with the "seq/Int" label attribute
     * @param int The Int signature
     * @private
     */
    private static _buildSeq (maxseq: number, element: Element, int: AlloySignature): IDSig {

        if (!element) throw Error('Instance contains no seq/Int element');

        let id = element.getAttribute('ID');
        if (!id) throw Error('Invalid seq/Int element');

        let seq = new AlloySignature('seq/Int', true, false, false, false, true);
        seq._type = int;

        for (let i=0; i<maxseq; ++i) {
            let atom  = int.findAtom(i.toString());
            if (!atom) throw Error('The maxseq value is invalid');
            seq._atoms.push(atom);
        }

        return {
            id: parseInt(id),
            sig: seq
        };

    }

    /**
     * Assemble a signature from an element of an XML file.
     *
     * @remarks
     * This method will not assemble subset signatures, as those require a
     * reference to their parent signature in order to extract existing atoms.
     *
     * @param element The XML sig element
     * @private
     */
    private static _buildSig (element: Element): IDSig {

        if (!element) throw Error('Signature element does not exist');

        let id = element.getAttribute('ID');
        if (!id) throw Error('Signature element has no ID attribute');

        let label = element.getAttribute('label');
        if (!label) throw Error('Signature element has no label attribute');

        let parentID = element.getAttribute('parentID');
        let builtin = element.getAttribute('builtin') === 'yes';
        let meta = element.getAttribute('meta') === 'yes';
        let one = element.getAttribute('one') === 'yes';
        let priv = element.getAttribute('private') === 'yes';
        let subset = is_subset(element);

        if (subset)
            throw Error('Subset signature must be built using AlloySignature._buildSub()');

        let sig = new AlloySignature(label, builtin, meta, one, priv, subset);

        element
            .querySelectorAll('atom')
            .forEach(atom => {

                let atomLabel = atom.getAttribute('label');
                if (!atomLabel) throw Error('Atom does not have a label');
                sig._atoms.push(new AlloyAtom(sig, atomLabel));

            });

        if (parentID) {
            return {
                id: parseInt(id),
                parentID: parseInt(parentID),
                sig: sig
            }
        } else {
            return {
                id: parseInt(id),
                sig: sig
            }
        }

    }

    /**
     * Assemble a subset signature from an element of an XML file.
     *
     * @remarks
     * This method assumes that the subset's parent signature has already been
     * created and is in the sigs map. Therefore, it's important to parse subset
     * signatures in a top-down fashion.
     *
     * @param element The XML sig element
     * @param sigs Map of sig ID's (as defined in XML) to signatures
     * @private
     */
    private static _buildSub (element: Element, sigs: Map<number, AlloySignature>): IDSig {

        if (!element) throw Error('Signature element does not exist');

        let id = element.getAttribute('ID');
        if (!id) throw Error('Signature element has no ID attribute');

        let label = element.getAttribute('label');
        if (!label) throw Error('Signature element has no label attribute');

        let parentID = subset_type_id(element);
        let builtin = element.getAttribute('builtin') === 'yes';
        let meta = element.getAttribute('meta') === 'yes';
        let one = element.getAttribute('one') === 'yes';
        let priv = element.getAttribute('private') === 'yes';
        let subset = is_subset(element);

        if (!subset)
            throw Error('Signatures must be built using AlloySignature._buildSig()');

        let parent = sigs.get(parentID);
        if (!parent) throw Error('Unable to find parent of subset signature');

        let sig = new AlloySignature(label, builtin, meta, one, priv, subset);

        element
            .querySelectorAll('atom')
            .forEach(el => {

                let atomLabel = el.getAttribute('label');
                if (!atomLabel) throw Error('Atom does not have a label');
                let atom = parent!.findAtom(atomLabel);
                if (!atom) throw Error(`Parent signature doesn not contain atom ${atomLabel}`);
                sig._atoms.push(atom);

            });

        return {
            id: parseInt(id),
            parentID: parentID,
            sig: sig
        };

    }

}
