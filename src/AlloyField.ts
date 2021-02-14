import { isDefined } from 'ts-is-present';
import { AlloyError } from './AlloyError';
import { AlloyProxy } from './AlloyProxy';
import { AlloySignature } from './AlloySignature';
import { AlloyTuple } from './AlloySet';
import { AlloyTypedSet } from './AlloyTypedSet';

class AlloyField extends AlloyTypedSet {

    private readonly _id: string;

    /**
     * Create a new Alloy field.
     * @param id The field's unique ID
     * @param types An array of signatures defining the types of each column of the field
     * @param tuples The tuples defined by the field
     * @param proxy If provided, a proxied signature will be created.
     * @param varName If provided, the variable name to assign to this field when proxied.
     */
    constructor (id: string, types: AlloySignature[], tuples: AlloyTuple[], proxy?: AlloyProxy, varName?: string) {

        super(types, tuples);
        this._id = id;

        return proxy
            ? proxy.applyProxy(this, varName ? cleanseVarName(varName) : id)
            : this;

    }

    /**
     * Create a clone of this field
     *
     * @param signatures An array of signatures. When creating the clone of this
     * field, the types associated with each column are not cloned. Instead,
     * provide an array of signatures and this method will find the corresponding
     * types by signature ID in the array and use them to define types of the
     * cloned field.
     * @param proxy If provided, a proxied clone will be returned.
     */
    clone (signatures: AlloySignature[], proxy?: AlloyProxy): AlloyField {

        const types = this.types().map(type => signatures.find(sig => sig.id() === type.id()));
        if (!types.every(isDefined))
            throw AlloyError.error('AlloyField', 'Missing type, cannot clone field');

        const tuples = this.tuples().map(tuple => {
            return new AlloyTuple(tuple.atoms().map((atom, index) => {
                const clonedAtom = types[index]!.atom(atom.id());
                if (!clonedAtom) throw AlloyError.error('AlloyField', 'Missing atom, cannot clone field');
                return clonedAtom;
            }));
        });

        if (proxy) {

            const varName = Reflect.get(this, '__var__');
            if (!varName) throw AlloyError.error('AlloyField', 'Cannot use proxy to clone non-proxied field');
            return new AlloyField(this.id(), types as AlloySignature[], tuples, proxy, varName);

        }

        return new AlloyField(this.id(), types as AlloySignature[], tuples);

    }

    /**
     * Get the field ID.
     */
    id (): string {

        return this._id;

    }

    /**
     * Build all fields from an XML ```<instance>``` element. All fields are
     * fully populated with tuples.
     *
     * @param instance The XML ```<instance>``` element
     * @param sigIDs A map of signature string IDs to signature objects
     * @param proxy If provided, all fields will be proxied.
     */
    static fieldsFromXML (instance: Element, sigIDs: Map<string, AlloySignature>, proxy?: AlloyProxy): AlloyField[] {

        const fldElements = Array.from(instance.querySelectorAll('field'));
        const fldCount = new Map<string, number>();

        fldElements.forEach(element => {
            const label = element.getAttribute('label');
            if (!label) throw AlloyError.missingAttribute('AlloyField', 'label');
            fldCount.set(label, (fldCount.get(label) || 0) + 1);
        });

        return fldElements.map(fieldElement => {

            const label = fieldElement.getAttribute('label');
            const parentID = fieldElement.getAttribute('parentID');
            const types = AlloySignature.typesFromXML(fieldElement, sigIDs);

            if (!label) throw AlloyError.missingAttribute('AlloyField', 'label');
            if (!parentID) throw AlloyError.missingAttribute('AlloyField', 'parentID');

            const count = fldCount.get(label) || 0;
            const parent = sigIDs.get(parentID);

            if (!parent) throw AlloyError.error('AlloyField', 'Field parent type does not exist');

            const varname = count > 1
                ? multiFieldName(label, parent)
                : label;

            const tuples = AlloyTuple.tuplesFromXML(fieldElement.querySelectorAll('tuple'), types);

            return new AlloyField(label, types, tuples, proxy, varname);

        });

    }

}

function multiFieldName (field: string, signature: AlloySignature): string {
    return `${Reflect.get(signature, '__var__')}$${field}`;
}

function cleanseVarName (id: string): string {
    return id
        .replace(/-/g, '$')
        .replace('/', '$');
}

export {
    AlloyField
}
