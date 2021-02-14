import { AlloyError } from './AlloyError';
import { AlloyProxy } from './AlloyProxy';
import { AlloySet, AlloyTuple } from './AlloySet';

/**
 * In Alloy, an atom is a primitive entity that is indivisible, immutable, and
 * uninterpreted.
 */
class AlloyAtom extends AlloySet {

    private readonly _id: string;

    constructor (id: string, proxy?: AlloyProxy) {

        super();

        const self = proxy
            ? proxy.applyProxy(this, varName(id))
            : this;

        this._id = id;
        this._tuples = [new AlloyTuple([self])];

        return self;

    }

    clone (proxy?: AlloyProxy): AlloyAtom {

        return new AlloyAtom(this.id(), proxy);

    }

    id (): string {

        return this._id;

    }

    static fromElement (element: Element, proxy?: AlloyProxy): AlloyAtom {

        const label = element.getAttribute('label');
        if (!label) throw AlloyError.missingAttribute('AlloyAtom', 'label');
        return new AlloyAtom(label, proxy);

    }

}

function varName (id: string): string {
    return id
        .replace('/', '$')
        .replace('-', '$');
}

export {
    AlloyAtom
}
