import { AlloySignature } from './AlloySignature';
import { AlloyField } from './AlloyField';
import { AlloySkolem } from './AlloySkolem';

/**
 * An Alloy signature paired with the IDs assigned to it in the instance XML file
 */
export interface IDSig {

    /**
     * The ID assigned to the signature in the instance XML file
     */
    id: number,

    /**
     * The ID of the signature's parent
     */
    parentID?: number,

    /**
     * The signature
     */
    sig: AlloySignature

}

/**
 * An Alloy field paired with the ID assigned to it in the instance XML file
 */
export interface IDField {

    /**
     * The ID assigned to the field in the instance XML file
     */
    id: number,

    /**
     * The field
     */
    field: AlloyField

}

export interface IDSkolem {

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
 * Build a function that can be used to filter an array of Elements by
 * removing those with a specific "label" attribute value.
 *
 * @remarks
 * If the Element does not have a "label" attribute, it will be excluded.
 *
 * @param exclude The labels to exclude
 */
function filter_exclude_labels (...exclude: Array<string>): {(element: Element): boolean} {

    return (element: Element) => {
        let label = element.getAttribute('label');
        if (!label) return false;
        return !exclude.includes(label);
    }

}

/**
 * Build a function that can be used to filter an array of Elements by
 * removing those that have any of the given attributes.
 * @param exclude
 */
function filter_exclude_attr (...exclude: Array<string>): {(element: Element): boolean} {

    return (element: Element) => {
        return !exclude.find(attr => !!element.getAttribute(attr));
    }

}

/**
 * Determine if the given element is a subset signature.
 *
 * @remarks
 * In an Alloy XML file, a subset signature will have a "type" element that
 * defines which signature it is a subset of.
 *
 * @param element The element to test
 */
function is_subset (element: Element) {

    return element.tagName === 'sig' && !!element.querySelector('type');

}

/**
 * Comparison function that can be used to sort an array of subset sig elements
 * based on type hierarchy. Guarantees that parents will appear before children.
 * @param a A subset sig element from an Alloy XML file
 * @param b A subset sig element from an Alloy XML file
 */
function subset_sort (a: Element, b: Element) {
    let aID = a.getAttribute('ID'),
        bID = b.getAttribute('ID'),
        aT = subset_type_id(a),
        bT = subset_type_id(b);
    if (!aID || !bID) throw Error('Element has no ID');
    if (bT === parseInt(aID)) return -1;
    if (aT === parseInt(bID)) return 1;
    return 0;
}

/**
 * Get the parent ID of a subset signature
 * @param element The subset signature element
 */
function subset_type_id (element: Element): number {
    let t = element.querySelector('type');
    if (!t) throw Error('Element is not a subset signature');
    let id = t.getAttribute('ID');
    if (!id) throw Error('Element is not a subset signature');
    return parseInt(id);
}

export {
    filter_exclude_attr,
    filter_exclude_labels,
    is_subset,
    subset_sort,
    subset_type_id
}
