export namespace xml {

    /**
     * Return a function that can be used to filter an array of Elements by
     * removing those with a specific "label" attribute value.
     *
     * @remarks
     * If the Element does not have a "label" attribute, it will be excluded.
     *
     * @param exclude The labels to exclude
     */
    export function filterExcludeLabels (...exclude: Array<string>): {(element: Element): boolean} {

        return (element: Element) => {
            let label = element.getAttribute('label');
            if (!label) return false;
            return !exclude.includes(label);
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
    export function isSubset (element: Element) {

        return element.tagName === 'sig' && !!element.querySelector('type');

    }

    /**
     * Comparison function that can be used to sort an array of subset sig elements
     * based on type hierarchy. Guarantees that parents will appear before children.
     * @param a A subset sig element from an Alloy XML file
     * @param b A subset sig element from an Alloy XML file
     */
    export function sortSubset (a: Element, b: Element) {
        let aID = a.getAttribute('ID'),
            bID = b.getAttribute('ID'),
            aT = subsetTypeID(a),
            bT = subsetTypeID(b);
        if (!aID || !bID) throw Error('Element has no ID');
        if (bT === parseInt(aID)) return -1;
        if (aT === parseInt(bID)) return 1;
        return 0;
    }

    /**
     * Get the parent ID of a subset signature
     * @param element The subset signature element
     */
    export function subsetTypeID (element: Element): number {
        let t = element.querySelector('type');
        if (!t) throw Error('Element is not a subset signature');
        let id = t.getAttribute('ID');
        if (!id) throw Error('Element is not a subset signature');
        return parseInt(id);
    }

}
