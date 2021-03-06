import { AlloyType } from '../AlloyTypes';
import { AlloyField } from './AlloyField';
import { AlloySignature } from './AlloySignature';
import { AlloyTuple } from './AlloyTuple';
import { AlloyWitness } from './AlloyWitness';

/**
 * An atom in an Alloy instance.
 *
 * @remarks
 * In Alloy, an atom is a primitive entity that is *indivisible*, *immutable*,
 * and *uninterpreted*.
 */
export class AlloyAtom extends AlloyWitness {

    /**
     * This atom's type
     */
    private readonly _type: AlloySignature;

    /**
     * Create a new Alloy atom.
     *
     * @param signature The type of this atom
     * @param name The name of this atom
     */
    constructor (signature: AlloySignature, name: string) {

        super(name);

        this._type = signature;

    }

    /**
     * Returns [[AlloyType.Atom]]
     */
    expressionType (): AlloyType {

        return AlloyType.Atom;

    }

    /**
     * Returns the unique ID of this atom.
     *
     * @remarks
     * The unique ID of an atom is a combination of the ID of the atom's type,
     * an [[AlloySignature]], and the atom's name, separated by a colon.
     */
    id (): string {

        return this._type.id() + ':' + this.name();

    }

    /**
     * Returns true if this atom is of type **signature**, false otherwise.
     * @param signature The signature to check against
     */
    isType (signature: AlloySignature): boolean {

        return this.typeHierarchy().includes(signature);

    }


    join (field: AlloyField): Array<AlloyTuple> {

        const tuples = field.tuples()
            .filter(tuple => tuple.atoms()[0] === this)
            .map(tuple => new AlloyTuple('', tuple.atoms().slice(1)));

        const seen: {[index: string]: boolean} = {};

        return tuples.filter(tuple => {
            return seen.hasOwnProperty(tuple.name())
                ? false
                : (seen[tuple.name()] = true);
        });

    }

    /**
     * Returns the size of this atom. Atoms always have size 1.
     */
    size(): number {

        return 1;

    }

    /**
     * Returns a printable string.
     */
    toString (): string {

        return this.name();

    }

    /**
     * Returns the type of this atom.
     *
     * @remarks
     * Due to the hierarchical nature of Alloy signatures, it is possible for
     * atoms to have multiple types. This method returns the atom's immediate
     * type, i.e., the "lowest" level signature of which it is a child.
     */
    type (): AlloySignature {

        return this._type;

    }

    /**
     * Return an array, in order from highest to lowest, of this atom's types.
     */
    typeHierarchy (): Array<AlloySignature> {

        return this._type.typeHierarchy();

    }

}
