import { AlloyError } from './AlloyError';
import { AlloySet } from './AlloySet';

class AlloyProxy {

    private readonly _sets: Map<string, AlloySet>;

    constructor () {

        this._sets = new Map();

    }

    applyProxy<T extends AlloySet> (set: T, id?: string): T {

        const _sets = this._sets;
        const _id: string = id || `${_sets.size}`;
        const _finalize = this._finalize.bind(this);

        if (_sets.has(_id))
            throw Error(`Cannot apply proxy, ID already exists: ${_id}`);

        const proxy = new Proxy<T>(set, {

            get (target: T, prop: string | number | symbol): any {

                if (typeof prop === 'symbol' || prop in target) {

                    return Reflect.get(target, prop);

                } else if (typeof prop === 'number' || !isNaN(+prop)) {

                    const left = _sets.get(`${prop}`);
                    if (!left) throw AlloyError.error('Join', `Integer atom does not exist: ${prop}`);
                    return _finalize(left.join(target));

                } else {

                    let join: AlloySet;
                    const match = prop.match(/\[(.*)]/);

                    if (match) {
                        const left = _sets.get(match[1]);
                        if (!left) throw AlloyError.error('Join', `No set ${match[1]}`);
                        join = left.join(target);
                    } else {
                        const right = _sets.get(prop);
                        if (!right) throw AlloyError.error('Join', `No set ${prop}`);
                        join = target.join(right);
                    }

                    return _finalize(join);

                }

            }

        });

        Reflect.set(proxy, Symbol.toPrimitive, () => `[${_id}]`);
        Reflect.set(proxy, '__var__', _id);

        this._sets.set(_id, proxy);

        return proxy;

    }

    private _finalize (set: AlloySet): AlloySet {

        if (set.tuples().length === 1 && set.tuples()[0].atoms().length === 1) {
            const atom = set.tuples()[0].atoms()[0];
            return this._sets.get(atom.id()) || this.applyProxy(atom, atom.id());
        }

        return this.applyProxy(set);

    }

}

export {
    AlloyProxy
}
