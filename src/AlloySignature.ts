import { isDefined } from 'ts-is-present';
import { AlloyAtom } from './AlloyAtom';
import { AlloyError } from './AlloyError';
import { AlloyProxy } from './AlloyProxy';
import { AlloySet, AlloyTuple } from './AlloySet';

/**
 * In Alloy, a signature introduces a set of atoms.
 */
class AlloySignature extends AlloySet {

    private readonly _id: string;
    private readonly _atoms: AlloyAtom[];

    private _subsignatures: AlloySignature[];

    /**
     * Create a new Alloy signature.
     *
     * @param id The signature's unique ID
     * @param atoms The atoms defined by the signature
     * @param proxy If provided, a proxied signature will be created.
     */
    constructor (id: string, atoms: AlloyAtom[], proxy?: AlloyProxy) {

        super();

        this._id = id;
        this._atoms = atoms;
        this._subsignatures = [];
        this._tuples = atoms.map(atom => new AlloyTuple([atom]));

        return proxy
            ? proxy.applyProxy(this, varName(id))
            : this;

    }

    /**
     * Get an atom by ID
     * @param id The atom ID
     * @returns An atom or null if there is no atom with the specified ID
     */
    atom (id: string): AlloyAtom | null {

        return this.atoms(true).find(atom => atom.id() === id) || null;

    }

    /**
     * Get an array of all atoms in this signature.
     * @param recursive If false, return only atoms defined by this signature,
     * if true, include atoms defined by all subsignatures as well.
     */
    atoms (recursive: boolean = false): AlloyAtom[] {

        return recursive
            ? this.atoms()
                .concat(this.subSignatures()
                    .map(subsig => subsig.atoms(true))
                    .reduce((acc, cur) => acc.concat(cur), []))
            : this._atoms.slice();

    }

    /**
     * Create a clone of this signature.
     * @param proxy If provided, a proxied clone will be returned.
     */
    clone (proxy?: AlloyProxy): AlloySignature {

        const clone = new AlloySignature(
            this.id(),
            this.atoms().map(atom => atom.clone(proxy)),
            proxy
        );

        clone._subsignatures = this.subSignatures().map(sig => sig.clone(proxy));

        return clone;

    }

    /**
     * Get the signature ID.
     */
    id (): string {

        return this._id;

    }

    /**
     * Get an array of all signatures that extend this signature.
     * @param recursive If false, return only signatures that are immediate
     * children of this signature. If true, return all signatures that are
     * descendants of this signature.
     */
    subSignatures (recursive: boolean = false): AlloySignature[] {

        return recursive
            ? this.subSignatures()
                .concat(this.subSignatures()
                    .map(subsig => subsig.subSignatures(true))
                    .reduce((acc, cur) => acc.concat(cur), []))
            : this._subsignatures.slice();

    }

    /**
     * Create a signature from an XML element and populate the signature with
     * atoms. Any signatures that extend the one defined in the element are not
     * created.
     *
     * @param element The XML ```<sig>``` element
     * @param proxy If provided, a proxied signature with proxied atoms will be
     * returned.
     */
    static fromElement (element: Element, proxy?: AlloyProxy): AlloySignature {

        const label = element.getAttribute('label');
        if (!label) throw AlloyError.missingAttribute('AlloySignature', 'label');

        const atoms = Array
            .from(element.querySelectorAll('atom'))
            .map(element => AlloyAtom.fromElement(element, proxy));

        return new AlloySignature(label, atoms, proxy);

    }

    /**
     * Create the Int signature.
     *
     * @param bitwidth The integer bitwidth, which must be greater than or equal to zero.
     * @param proxy If provided, a proxied Int signature with proxied atoms will
     * be returned.
     */
    static intSignature (bitwidth: number, proxy?: AlloyProxy): AlloySignature {

        if (bitwidth < 0) throw AlloyError.error('AlloySignature', 'Invalid bitwidth');

        const atoms: AlloyAtom[] = [];
        for (let n = 2 ** bitwidth, i = -n / 2; i < n / 2; ++i) {
            const atom = new AlloyAtom(i.toString(), proxy);
            atoms.push(atom);
        }

        return new AlloySignature('Int', atoms, proxy);

    }

    /**
     * TODO: Check and document this.
     * @param intsig
     * @param proxy
     */
    static seqIntSignature (intsig: AlloySignature, proxy?: AlloyProxy): AlloySignature {

        return new AlloySignature('seq/Int', intsig.atoms(), proxy);

    }

    /**
     * Build all signatures from an XML ```<instance>``` element. All signatures are
     * populated with atoms.
     *
     * @param instance The XML ```<instance>``` element
     * @param proxy If provided, all signatures and atoms will be proxied.
     * @returns A map of string IDs, as defined by the "ID" attribute for each
     * signature, to [[AlloySignature]] objects.
     */
    static signaturesFromXML (instance: Element, proxy?: AlloyProxy): Map<string, AlloySignature> {

        const bitwidth = +(instance.getAttribute('bitwidth') || -1);
        const intsig = AlloySignature.intSignature(bitwidth, proxy);

        const sigElements = Array.from(instance.querySelectorAll('sig'));
        const sigChildren = new Map<string, string[]>();
        const sigIDs = new Map<string, AlloySignature>();

        sigElements
            .map(sigEl => {

                const id = sigEl.getAttribute('ID');
                const parent = sigEl.getAttribute('parentID');
                const label = sigEl.getAttribute('label');
                if (!id) throw AlloyError.missingAttribute('AlloySignature', 'ID');
                if (!parent && label !== 'univ') throw AlloyError.missingAttribute('AlloySignature', 'parentID');

                const signature = (label === 'Int' || label === 'seq/Int')
                    ? intsig
                    // : label === 'seq/Int'
                    //     ? AlloySignature.seqIntSignature(intsig, proxy)
                    : AlloySignature.fromElement(sigEl, proxy);

                sigIDs.set(id, signature);

                if (parent && label !== 'seq/Int') {
                    if (!sigChildren.has(parent))
                        sigChildren.set(parent, []);
                    sigChildren.get(parent)!.push(id);
                }

                return signature;

            });

        sigIDs.forEach((signature, id) => {

            const childIDs = sigChildren.get(id) || [];

            signature._subsignatures = childIDs
                .map(id => sigIDs.get(id))
                .filter(isDefined);

        });

        return sigIDs;

    }

    /**
     * Get an array of signature types associated with an XML element. Typically
     * this is used when parsing a field or skolem, as each ```<field>``` and ```<skolem>```
     * element will have a ```<types>``` child. This method parses the types defined
     * in this element and returns the corresponding signatures.
     *
     * @param element The XML element that has a <types> child
     * @param sigIDs A map of signature IDs to signatures
     */
    static typesFromXML (element: Element, sigIDs: Map<string, AlloySignature>): AlloySignature[] {

        const types = element.querySelector('types');
        if (!types) throw AlloyError.missingElement('AlloyField', 'types');

        return Array.from(types.querySelectorAll('type'))
            .map(typeElement => {

                const typeID = typeElement.getAttribute('ID');
                if (!typeID) throw AlloyError.missingAttribute('AlloyField', 'ID');

                const signature = sigIDs.get(typeID);
                if (!signature) throw AlloyError.error('Alloy Field', `No signature with ID: ${typeID}`);

                return signature;

            });

    }

}

function varName (id: string): string {
    return id
        .replace(/^this\//, '')
        .replace('/', '$')
        .replace('-', '$');
}

export {
    AlloySignature
}
