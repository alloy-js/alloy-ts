/**
 * The abstract superclass for all elements of an Alloy instance.
 */
export abstract class AlloyElement {

    /**
     * The name of this element.
     */
    private readonly _name: string;

    /**
     * Create a new named Element.
     * @param name The name of the element
     */
    protected constructor (name: string) {

        this._name = name;

    }

    /**
     * Returns the expression type of this element
     *
     * @remarks
     * This method returns the type of this element in the context of an Alloy
     * instance. For example, an [[AlloyAtom]] will return the string 'atom' and a
     * [[AlloySignature]] will return the string 'signature'.
     *
     */
    abstract expressionType (): string;

    /**
     * Returns the unique ID of this element.
     *
     * @remarks
     * This method is guaranteed to return an ID that is unique to all elements
     * within a single Alloy instance, and is typically constructed by
     * concatenating the names of an element's ancestors within the instance
     * hierarchy.
     *
     */
    abstract id (): string;

    /**
     * Returns the name of this element.
     */
    name (): string {

        return this._name;

    }

}
