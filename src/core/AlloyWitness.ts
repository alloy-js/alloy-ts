import { AlloyElement } from './AlloyElement';
import { AlloySkolem } from './AlloySkolem';

/**
 * # AlloyWitness
 *
 * An AlloyWitness is an [[AlloyElement]] that can appear in a
 * [[AlloySkolem|skolem]].  These include [[AlloyAtom|atoms]] and
 * [[AlloyTuple|tuples]].  This class gives access to the skolems that
 * contain an equivalent element.  For example, if this is an atom, any skolems
 * returned by the `.skolems()` method are skolem sets that contain this atom.
 * Similarly, if this is a tuple, any skolems returned by the `.skolems()`
 * method are skolem sets that contain a tuple equivalent to this one (note that
 * the skolem will not include this tuple object because skolemized tuples may
 * appear in more than one relation).
 *
 */
export abstract class AlloyWitness extends AlloyElement {

    private readonly _skolems: AlloySkolem[];

    /**
     * Create a new Alloy Witness
     * @param name The name of this witness
     */
    protected constructor (name: string) {

        super(name);
        this._skolems = [];

    }

    /**
     * Return an array of skolems that include an element equivalent to this
     * element.
     */
    public skolems (): AlloySkolem[] {

        return this._skolems.slice();

    }

    /**
     * Add a skolem to the provided witness.
     * @param witness The witness
     * @param skolem The skolem
     */
    public static addSkolem (witness: AlloyWitness, skolem: AlloySkolem) {

        witness._skolems.push(skolem);

    }

}
