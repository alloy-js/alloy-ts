import { AlloyType } from '../AlloyTypes';
import { AlloyAtom } from './AlloyAtom';
import { AlloySignature } from './AlloySignature';
import { AlloyWitness } from './AlloyWitness';

interface Attributes {
    [key: string]: string
}

/**
 * # AlloyTuple
 *
 * In Alloy, a tuple is a sequence of one or more atoms. As part of an Alloy
 * instance, tuples can either reside in a [[AlloyField|field]] or exist as a
 * free variable that makes an existentially quantified formula true, known as a
 * [[AlloySkolem|skolemization]].
 */
export class AlloyTuple extends AlloyWitness {

    private readonly _id: string;
    private readonly _atoms: Array<AlloyAtom>;
    private readonly _attributes: Attributes;

    /**
     * Create a new Alloy tuple.
     *
     * @remarks
     * Because it is possible for multiple tuples to contain the same ordered
     * set of atoms, a unique ID cannot be generated based on content alone.
     * Therefore, a unique ID must be provided upon creation.
     *
     * @param id The unique identifier for this tuple
     * @param atoms The ordered array of atoms that comprise this tuple
     * @param attributes A dictionary of key/value pair attributes
     */
    constructor (id: string, atoms: Array<AlloyAtom>, attributes?: Attributes) {

        super(`{${atoms.map(atom => atom.name()).join('->')}}`);

        this._id = id;
        this._atoms = atoms;
        this._attributes = attributes || {};

    }

    /**
     * Returns the number of atoms in this tuple.
     */
    arity (): number {

        return this._atoms.length;

    }

    /**
     * Returns the ordered array of atoms that comprise this tuple.
     */
    atoms (): Array<AlloyAtom> {

        return this._atoms.slice();

    }

    attributes (): Attributes {

        return this._attributes;

    }

    /**
     * Returns true if this tuple is equivalent to the provided tuple. Tuples
     * are equivalent if they contain the same set of atoms in the same order.
     * @param tuple
     */
    equals (tuple: AlloyTuple) {

        const atoms = tuple.atoms();

        return this.arity() === tuple.arity() &&
            this.atoms()
                .map((atom: AlloyAtom, i: number) => {
                    return atoms[i] === atom
                })
                .reduce((prev: boolean, curr: boolean) => prev && curr, true);

    }

    /**
     * Returns [[AlloyType.Tuple]]
     */
    expressionType (): AlloyType {

        return AlloyType.Tuple;

    }

    /**
     * Returns the unique ID of this tuple.
     *
     * @remarks
     * This unique ID must be provided to the constructor, as uniqueness of an
     * ID based on atoms alone cannot be guaranteed.
     */
    id (): string {

        return this._id;

    }

    /**
     * Returns the size of this tuple. Tuples always have size 1, as they are
     * considered a single 'row' in a field.
     */
    size (): number {

        return 1;

    }

    /**
     * Returns a printable string.
     */
    toString (): string {

        return this.name();

    }

    /**
     * Returns an ordered array of the types of the atoms in this tuple.
     */
    types (): Array<AlloySignature> {

        return this._atoms.map(atom => atom.type());

    }

    /**
     * Assemble a tuple for a [[AlloyField|field]].
     *
     * @remarks
     * The ID generated for a tuple in a field is the name of the first atom's
     * type followed by the list of atoms separated by arrows.
     *
     * @param element The XML tuple element
     * @param types The array of types for this tuple
     */
    static buildFieldTuple (element: Element, types: Array<AlloySignature>): AlloyTuple {

        let atoms = AlloyTuple._getTupleAtoms(element, types);
        let id = types[0].id() + '<:' + atoms.map(a => a.name()).join('->');
        const attrs = AlloyTuple._getTupleAttributes(element);

        return new AlloyTuple(id, atoms, attrs);

    }

    /**
     * Assemble a tuple for a [[AlloySkolem|skolem]].
     *
     * @remarks
     * The ID generated for a tuple in a skolem is the name of the skolem
     * followed by the list of atoms separated by arrows.
     *
     * @param skolemName The name of the skolem
     * @param element The XML tuple element
     * @param types The array of types for this tuple
     */
    static buildSkolemTuple (skolemName: string, element: Element, types: Array<AlloySignature>): AlloyTuple {

        const atoms = AlloyTuple._getTupleAtoms(element, types);
        const id = skolemName + '<:' + atoms.map(a => a.name()).join('->');
        const attrs = AlloyTuple._getTupleAttributes(element);

        return new AlloyTuple(id, atoms, attrs);

    }

    /**
     * Assemble the array of [[AlloyAtom|atoms]] that comprise a tuple.
     *
     * @param element The XML tuple element
     * @param types The array of types for this tuple
     * @private
     */
    private static _getTupleAtoms (element: Element, types: Array<AlloySignature>): Array<AlloyAtom> {

        let atomLabels = Array
            .from(element.querySelectorAll('atom'))
            .map(atom => atom.getAttribute('label'));

        if (atomLabels.includes(null)) throw Error('Atom has no label attribute');

        let atoms = atomLabels.map((label, i) => types[i].findAtom(label!));

        if (atoms.includes(null)) throw Error('Unable to find all atoms in tuple');

        return atoms as Array<AlloyAtom>;

    }

    private static _getTupleAttributes (element: Element): Attributes {

        const attrs: Attributes = {};

        element.getAttributeNames().forEach(name => {
            attrs[name] = element.getAttribute(name)!;
        });

        return attrs;

    }

}
