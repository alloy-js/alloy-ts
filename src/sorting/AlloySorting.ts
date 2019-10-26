import { AlloyNameFn, AlloySortFn, AlloyType } from '../AlloyTypes';
import { AlloyElement } from '../core/AlloyElement';
import { AlloyField } from '../core/AlloyField';
import { AlloySignature } from '../core/AlloySignature';
import { AlloySkolem } from '../core/AlloySkolem';

export namespace sorting {

    /**
     * Return a function that can be used in Array.sort() to sort alphabetically.
     * @param name The function that will be used to retrieve the name of each item.
     * If no function is provided, AlloyElement.name() will be used.
     * @param ascending True (default) to sort in ascending order, false to sort in
     * descending order.
     */
    export function alphabeticalSort (name?: AlloyNameFn, ascending: boolean = true): AlloySortFn {
        const one = ascending ? 1 : -1;
        name = name ? name : (item: AlloyElement) => item.name();
        return (a: AlloyElement, b: AlloyElement): number => {
            const aname = name!(a);
            const bname = name!(b);
            if (aname < bname) return -one;
            if (bname < aname) return one;
            return 0;
        }
    }

    /**
     * Return a function that can be used in Array.sort() to sort Alloy items
     * based on whether or not they are builtins. Only signatures can be "builtins"
     * so only signatures are affected by this sort function.
     * @param builtinLast Sort so that builtins are moved to the end of the array
     */
    export function builtinSort (builtinLast: boolean = true): AlloySortFn {
        const one = builtinLast ? 1 : -1;
        return (a: AlloyElement, b: AlloyElement): number => {
            const aSig = a.expressionType() === 'signature';
            const bSig = b.expressionType() === 'signature';
            if (aSig === bSig) {
                if (!aSig) return 0;
                const aB = (a as AlloySignature).isBuiltin();
                const bB = (b as AlloySignature).isBuiltin();
                return aB === bB ? 0 : aB ? one : -one;
            } else {
                const aB = aSig && (a as AlloySignature).isBuiltin();
                const bB = bSig && (b as AlloySignature).isBuiltin();
                return aB ? one : bB ? -one : 0;
            }
        }
    }

    /**
     * Return a function that can be used in Array.sort() to group Alloy items by
     * type. The default order is as follows:
     *  - Signatures
     *  - Atoms
     *  - Fields
     *  - Tuples
     *  - Skolems
     * @param groups The grouping order of types.
     */
    export function groupSort (groups?: AlloyType[]): AlloySortFn {
        groups = groups || [
            AlloyType.Signature,
            AlloyType.Atom,
            AlloyType.Field,
            AlloyType.Tuple,
            AlloyType.Skolem
        ];
        return (a: AlloyElement, b: AlloyElement): number => {
            return groups!.indexOf(a.expressionType()) - groups!.indexOf(b.expressionType());
        }
    }

    /**
     * Return a function that can be used in Array.sort() to sort Alloy items by
     * size. Sizes of items are as follows:
     *  - Atom: 1
     *  - Field: Number of tuples
     *  - Signature: Number of Atoms (not nested)
     *  - Skolem: Number of tuples
     *  - Tuple: 1
     * @param ascending Sort by size in ascending order (true) or descending
     * order (false).
     */
    export function sizeSort (ascending: boolean = true): AlloySortFn {
        const one = ascending ? 1 : -1;
        return (a: AlloyElement, b: AlloyElement) => {
            const asize = getSize(a);
            const bsize = getSize(b);
            return (asize - bsize) * one;
        }
    }

    /**
     * Retrieve the size of an item. Sizes of items are as follows:
     *  - Atom: 1
     *  - Field: Number of tuples
     *  - Signature: Number of Atoms (not nested)
     *  - Skolem: Number of tuples
     *  - Tuple: 1
     * @param item
     */
    function getSize (item: AlloyElement) {
        switch (item.expressionType()) {
            case AlloyType.Atom:
                return 1;
            case AlloyType.Field:
                return (item as AlloyField).tuples().length;
            case AlloyType.Signature:
                return (item as AlloySignature).atoms().length;
            case AlloyType.Skolem:
                return (item as AlloySkolem).tuples().length;
            case AlloyType.Tuple:
                return 1;
            default:
                return 0;
        }
    }

}