import { AlloyType } from '../AlloyTypes';
import { AlloyElement } from '../core/AlloyElement';

export namespace filtering {

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by keeping only [[AlloyAtom|atoms]]
     * @param item The current item being tested.
     */
    export function keepAtoms (item: AlloyElement): boolean {
        return item.expressionType() === AlloyType.Atom;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by keeping only [[AlloyField|fields]]
     * @param item The current item being tested.
     */
    export function keepFields (item: AlloyElement): boolean {
        return item.expressionType() === AlloyType.Field;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by keeping only [[AlloySignature|signatures]]
     * @param item The current item being tested.
     */
    export function keepSignatures (item: AlloyElement): boolean {
        return item.expressionType() === AlloyType.Signature;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by keeping only [[AlloySkolem|skolems]]
     * @param item The current item being tested.
     */
    export function keepSkolems (item: AlloyElement): boolean {
        return item.expressionType() === AlloyType.Skolem;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by keeping only [[AlloyTuple|tuples]]
     * @param item The current item being tested.
     */
    export function keepTuples (item: AlloyElement): boolean {
        return item.expressionType() === AlloyType.Tuple;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by removing only [[AlloyAtom|atoms]]
     * @param item The current item being tested.
     */
    export function removeAtoms (item: AlloyElement): boolean {
        return item.expressionType() !== AlloyType.Atom;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by removing only [[AlloyField|fields]]
     * @param item The current item being tested.
     */
    export function removeFields (item: AlloyElement): boolean {
        return item.expressionType() !== AlloyType.Field;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by removing only [[AlloySignature|signatures]]
     * @param item The current item being tested.
     */
    export function removeSignatures (item: AlloyElement): boolean {
        return item.expressionType() !== AlloyType.Signature;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by removing only [[AlloySkolem|skolems]]
     * @param item The current item being tested.
     */
    export function removeSkolems (item: AlloyElement): boolean {
        return item.expressionType() !== AlloyType.Skolem;
    }

    /**
     * Function that can be used to filter an array of [[AlloyElement|elements]]
     * by removing only [[AlloyTuple|tuples]]
     * @param item The current item being tested.
     */
    export function removeTuples (item: AlloyElement): boolean {
        return item.expressionType() !== AlloyType.Tuple;
    }
    
}
