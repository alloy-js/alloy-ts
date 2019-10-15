import { AlloyElement } from './AlloyElement';
import { AlloySignature } from './AlloySignature';
import { AlloyTuple } from './AlloyTuple';
import { IDField } from './AlloyXML';

export class AlloyField extends AlloyElement {

    private readonly _types: Array<AlloySignature>;
    private readonly _tuples: Array<AlloyTuple>;

    private readonly _is_meta: boolean;
    private readonly _is_private: boolean;

    /**
     * Create a new Alloy field.
     *
     * @remarks
     * An Alloy field consists of an ordered array of
     * [[AlloySignature|signatures]] that define the types of the "columns" of
     * the relation defined by the field, as well as a list of
     * [[AlloyTuple|tuples]] that define the contents (or "rows") of the
     * relation. The arity of the field, or number of columns, must be at least
     * two.
     *
     * @param name The name of this field
     * @param types The types that define the columns of this relation
     * @param tuples The contents of this relation
     * @param is_meta Is this a meta field?
     * @param is_private Is this a private field?
     *
     * @throws Error When the arity is less than two or an atom's type does not
     * match the type of the column in which it resides.
     */
    constructor (name: string,
                 types: Array<AlloySignature>,
                 tuples: Array<AlloyTuple>,
                 is_meta?: boolean,
                 is_private?: boolean) {

        super(name);

        this._types = types;
        this._tuples = tuples;
        this._is_meta = is_meta ? is_meta : false;
        this._is_private = is_private ? is_private : false;

        // Check that the field has an arity of at least two
        if (types.length < 2) {
            throw Error(`Field ${name} has arity less than two.`);
        }

        // Check that all tuples are composed of correct types
        tuples.forEach(tuple => {
            tuple.atoms().forEach((atom, i) => {
                if (!atom.isType(types[i])) {
                    throw Error(`Tuple ${tuple} has incorrect types.`);
                }
            });
        });

    }

    /**
     * Returns the number of "columns" in the relation defined by this field.
     */
    arity (): number {

        return this._types.length;

    }

    /**
     * Returns the string `field`.
     */
    expressionType (): string {

        return 'field';

    }

    /**
     * Returns the unique ID of this field.
     *
     * @remarks
     * The unique ID of a field is constructed as the name of the type of the
     * first column of the relation, followed by a `<:`, followed by the name
     * of this field.
     */
    id (): string {

        return this._types[0].name() + '<:' + this.name();

    }

    /**
     * Returns true if this is a meta field, false otherwise.
     */
    is_meta (): boolean {

        return this._is_meta;

    }

    /**
     * Returns true if this is a private field, false otherwise.
     */
    is_private (): boolean {

        return this._is_private;

    }

    /**
     * Returns the signature that defines this field.
     */
    parent (): AlloySignature {

        return this._types[0];

    }

    /**
     * Returns the number of "rows" in the relation defined by this field.
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
     * Returns a copy of this field's tuples.
     */
    tuples (): Array<AlloyTuple> {

        return this._tuples.slice();

    }

    /**
     * Returns a copy of the types that define the columns of this relation.
     */
    types (): Array<AlloySignature> {

        return this._types.slice();

    }

    /**
     * Build all fields in an XML Alloy instance.
     *
     * @param elements An array of "field" elements from the XML file
     * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
     */
    static buildFields (elements: Array<Element>, sigs: Map<number, AlloySignature>): Map<number, AlloyField> {

        let fields: Map<number, AlloyField> = new Map();

        elements
            .map(element => AlloyField._buildField(element, sigs))
            .forEach(field => fields.set(field.id, field.field));

        return fields;

    }

    /**
     * Assemble a field from an element of an XML file.
     *
     * @param element The XML "field" element
     * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
     * @private
     */
    private static _buildField (element: Element, sigs: Map<number, AlloySignature>): IDField {

        // Get and check field attributes
        let id = element.getAttribute('ID');
        let parentID = element.getAttribute('parentID');
        let label = element.getAttribute('label');
        let typesEl = element.querySelector('types');
        let meta = element.getAttribute('meta') === 'yes';
        let priv = element.getAttribute('private') === 'yes';

        if (!id) throw Error('Field has no ID attribute');
        if (!parentID) throw Error('Field has no parentID attribute');
        if (!label) throw Error('Field has no label attribute');
        if (!typesEl) throw Error('Field has no types');

        // Get the parent signature of the field
        let parent = sigs.get(parseInt(parentID));
        if (!parent) throw Error('Field parent type has not been created');

        // Get and check the types used in this field
        let typeIDs = Array
            .from(typesEl.querySelectorAll('type'))
            .map(el => el.getAttribute('ID'));
        if (typeIDs.includes(null)) throw Error('Undefined type in field');

        let types: Array<AlloySignature|undefined> = typeIDs.map(id => sigs.get(parseInt(id!)));
        if (types.includes(undefined)) throw Error('A field type has not been created');

        // Get and assemble the tuples
        let tuples = Array
            .from(element.querySelectorAll('tuple'))
            .map(el => AlloyTuple.buildFieldTuple(el, types as Array<AlloySignature>));

        let field = new AlloyField(label, types as Array<AlloySignature>, tuples, meta, priv);

        return {
            id: parseInt(id),
            field: field
        };

    }

}
