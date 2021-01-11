import { AlloyType } from '../AlloyTypes';
import { AlloyAtom } from './AlloyAtom';
import { AlloyElement } from './AlloyElement';
import { AlloyField } from './AlloyField';
import { AlloySignature } from './AlloySignature';
import { AlloyTuple } from './AlloyTuple';

/**
 * An Alloy skolem paired with the ID assigned to it in the instance XML
 * file.
 */
interface IDSkolem {

    /**
     * The ID assigned to the skolem in the instance XML file
     */
    id: number,

    /**
     * The skolem
     */
    skolem: AlloySkolem

}

/**
 * # AlloySkolem
 *
 * In Alloy, values for variables that make the body of an existentially
 * quantified formula true are found using a transformation known as
 * skolemization. We represent these values using the AlloySkolem class and
 * typically refer to them as skolems. Skolems can be scalars, sets, or
 * relations and the internal representation is similar to a field; the
 * exception for skolems is that the arity of a skolem can be one, allowing
 * us to represent scalars and sets.
 */
export class AlloySkolem extends AlloyElement {

    private readonly _types: AlloySignature[][];
    private readonly _tuples: Array<AlloyTuple>;

    /**
     * Create a new Alloy skolem.
     *
     * @param name The name of this skolem
     * @param types The types that define the columns of this skolem
     * @param tuples The contents of this skolem
     */
    constructor (name: string,
                 types: AlloySignature[][],
                 tuples: Array<AlloyTuple>) {

        super(name);

        this._types = types;
        this._tuples = tuples;

    }

    /**
     * Returns the number of "columns" in this skolem.
     *
     * @remarks
     * Skolems that are scalars or sets will have an arity of one.
     */
    arity (): number {

        return this._types.length;

    }

    /**
     * Returns [[AlloyType.Skolem]]
     */
    expressionType (): AlloyType {

        return AlloyType.Skolem;

    }

    /**
     * Returns the unique ID of this skolem.
     *
     * @remarks
     * The unique ID of a skolem is also its name, as Alloy generates unique
     * names for all skolemized variables.
     */
    id (): string {

        return this.name();

    }

    /**
     * Returns the number of "rows" in this skolem.
     *
     * @remarks
     * Skolems that are scalars will have a size of one.
     */
    size (): number {

        return this._tuples.length;

    }

    /**
     * Returns a printable string.
     */
    toString (): string {

        return this.name();

    }

    /**
     * Returns a copy of this skolem's tuples.
     */
    tuples (): Array<AlloyTuple> {

        return this._tuples.slice();

    }

    /**
     * Returns a copy of the types that define the columns of this skolem.
     */
    types (): AlloySignature[][] {

        return this._types.slice();

    }

    /**
     * Build all skolems in an XML Alloy instance
     * @param elements An array of "skolem" elements from the XML file
     * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
     * @param flds A map of field IDs (as assigned in the XML file) to fields
     */
    static buildSkolem (
        elements: Array<Element>,
        sigs: Map<number, AlloySignature>,
        flds: Map<number, AlloyField>
    ): Map<number, AlloySkolem> {

        let skolems: Map<number, AlloySkolem> = new Map();

        elements
            .map(element => AlloySkolem._buildSkolem(element, sigs, flds))
            .forEach(skolem => skolems.set(skolem.id, skolem.skolem));

        return skolems;

    }

    /**
     * Assemble a skolem from an element of an XML file.
     *
     * @param element The XML "skolem" element
     * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
     * @param flds A map of field IDs (as assigned in the XML file) to fields
     * @private
     */
    private static _buildSkolem (
        element: Element,
        sigs: Map<number, AlloySignature>,
        flds: Map<number, AlloyField>
    ): IDSkolem {

        // Get and check skolem attributes
        let id = element.getAttribute('ID');
        let label = element.getAttribute('label');
        // let typesEl = element.querySelector('types');
        let typesEls = element.querySelectorAll('types');

        if (!id) throw Error('Skolem has no ID attribute');
        if (!label) throw Error('Skolem has no label attribute');
        // if (!typesEl) throw Error('Skolem has no type(s)');

        // Get and check the types of this skolem
        // let typeIDs = Array
        //     .from(typesEl.querySelectorAll('type'))
        //     .map(el => el.getAttribute('ID'));
        // if (typeIDs.includes(null)) throw Error('Undefined type in skolem');
        let typeIDs = Array
            .from(typesEls)
            .map(typesel => Array
                .from(typesel.querySelectorAll('type'))
                .map(el => el.getAttribute('ID')));
        if (typeIDs.some(IDs => IDs.includes(null))) throw Error('Undefined type in skolem');

        // let types: Array<AlloySignature|undefined> = typeIDs.map(id => sigs.get(parseInt(id!)));
        // if (types.includes(undefined)) throw Error('A skolem type has not been created');
        let types: (AlloySignature|undefined)[][] = typeIDs.map(IDs => IDs.map(id => sigs.get(parseInt(id!))));
        if (types.some(ts => ts.includes(undefined))) throw Error('A skolem type has not been created');

        // Get and assemble the tuples
        let tuples = Array
            .from(element.querySelectorAll('tuple'))
            .map(el => AlloyTuple.buildSkolemTuple(label!, el, types as AlloySignature[][]));

        // Create the skolem
        let skolem = new AlloySkolem(label, types as AlloySignature[][], tuples);

        // Inject the skolem into witnesses
        if (types.length === 1) {

            // A set of atoms, so tell each atom that it's part of this skolem
            tuples.forEach((tuple: AlloyTuple) => {
                tuple.atoms().forEach((atom: AlloyAtom) => {
                    AlloyAtom.addSkolem(atom, skolem);
                });
            });

        } else if (types.length > 1) {

            // A set of tuples, so tell each tuple that it's part of this skolem
            Array.from(flds.values())
                .forEach((field: AlloyField) => {
                    field.tuples().forEach((tuple: AlloyTuple) => {
                        let eqv = tuples.find((value: AlloyTuple) => tuple.equals(value));
                        if (eqv) {
                            AlloyTuple.addSkolem(tuple, skolem);
                        }
                    })
                });

        }

        return {
            id: parseInt(id),
            skolem: skolem
        };

    }

}
