/*!
 * MIT License
 *
 * Copyright (c) 2019 Tristan Dyer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.alloy = {}));
}(this, (function (exports) { 'use strict';

    var AlloyType;
    (function (AlloyType) {
        AlloyType["Atom"] = "atom";
        AlloyType["Field"] = "field";
        AlloyType["Signature"] = "signature";
        AlloyType["Skolem"] = "skolem";
        AlloyType["Tuple"] = "tuple";
    })(AlloyType || (AlloyType = {}));

    /**
     * The abstract superclass for all elements of an Alloy instance.
     */
    class AlloyElement {
        /**
         * Create a new named Element.
         * @param name The name of the element
         */
        constructor(name) {
            this._name = name;
        }
        /**
         * Returns the name of this element.
         */
        name() {
            return this._name;
        }
    }

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
    class AlloyWitness extends AlloyElement {
        /**
         * Create a new Alloy Witness
         * @param name The name of this witness
         */
        constructor(name) {
            super(name);
            this._skolems = [];
        }
        /**
         * Return an array of skolems that include an element equivalent to this
         * element.
         */
        skolems() {
            return this._skolems.slice();
        }
        /**
         * Add a skolem to the provided witness.
         * @param witness The witness
         * @param skolem The skolem
         */
        static addSkolem(witness, skolem) {
            witness._skolems.push(skolem);
        }
    }

    /**
     * An atom in an Alloy instance.
     *
     * @remarks
     * In Alloy, an atom is a primitive entity that is *indivisible*, *immutable*,
     * and *uninterpreted*.
     */
    class AlloyAtom extends AlloyWitness {
        /**
         * Create a new Alloy atom.
         *
         * @param signature The type of this atom
         * @param name The name of this atom
         */
        constructor(signature, name) {
            super(name);
            this._type = signature;
        }
        /**
         * Returns [[AlloyType.Atom]]
         */
        expressionType() {
            return AlloyType.Atom;
        }
        /**
         * Returns the unique ID of this atom.
         *
         * @remarks
         * The unique ID of an atom is a combination of the ID of the atom's type,
         * an [[AlloySignature]], and the atom's name, separated by a colon.
         */
        id() {
            return this._type.id() + ':' + this.name();
        }
        /**
         * Returns true if this atom is of type **signature**, false otherwise.
         * @param signature The signature to check against
         */
        isType(signature) {
            return this.typeHierarchy().includes(signature);
        }
        /**
         * Returns the size of this atom. Atoms always have size 1.
         */
        size() {
            return 1;
        }
        /**
         * Returns a printable string.
         */
        toString() {
            return this.name();
        }
        /**
         * Returns the type of this atom.
         *
         * @remarks
         * Due to the hierarchical nature of Alloy signatures, it is possible for
         * atoms to have multiple types. This method returns the atom's immediate
         * type, i.e., the "lowest" level signature of which it is a child.
         */
        type() {
            return this._type;
        }
        /**
         * Return an array, in order from highest to lowest, of this atom's types.
         */
        typeHierarchy() {
            return this._type.typeHierarchy();
        }
    }

    /**
     * # AlloyTuple
     *
     * In Alloy, a tuple is a sequence of one or more atoms. As part of an Alloy
     * instance, tuples can either reside in a [[AlloyField|field]] or exist as a
     * free variable that makes an existentially quantified formula true, known as a
     * [[AlloySkolem|skolemization]].
     */
    class AlloyTuple extends AlloyWitness {
        /**
         * Create a new Alloy tuple.
         *
         * @remarks
         * Because it is possible for multiple tuples to contain the same ordered
         * set of atoms, a unique ID cannot be generated based on content alone.
         * Therefore, a unique ID must be provided upon creation.
         *
         * @param id The unique identifier for this tuple
         * @param atoms The ordered array of atoms that comprise this tuple
         */
        constructor(id, atoms) {
            super(`{${atoms.map(atom => atom.name()).join('->')}}`);
            this._id = id;
            this._atoms = atoms;
        }
        /**
         * Returns the number of atoms in this tuple.
         */
        arity() {
            return this._atoms.length;
        }
        /**
         * Returns the ordered array of atoms that comprise this tuple.
         */
        atoms() {
            return this._atoms.slice();
        }
        /**
         * Returns true if this tuple is equivalent to the provided tuple. Tuples
         * are equivalent if they contain the same set of atoms in the same order.
         * @param tuple
         */
        equals(tuple) {
            const atoms = tuple.atoms();
            return this.arity() === tuple.arity() &&
                this.atoms()
                    .map((atom, i) => {
                    return atoms[i] === atom;
                })
                    .reduce((prev, curr) => prev && curr, true);
        }
        /**
         * Returns [[AlloyType.Tuple]]
         */
        expressionType() {
            return AlloyType.Tuple;
        }
        /**
         * Returns the unique ID of this tuple.
         *
         * @remarks
         * This unique ID must be provided to the constructor, as uniqueness of an
         * ID based on atoms alone cannot be guaranteed.
         */
        id() {
            return this._id;
        }
        /**
         * Returns the size of this tuple. Tuples always have size 1, as they are
         * considered a single 'row' in a field.
         */
        size() {
            return 1;
        }
        /**
         * Returns a printable string.
         */
        toString() {
            return this.name();
        }
        /**
         * Returns an ordered array of the types of the atoms in this tuple.
         */
        types() {
            return this._atoms.map(atom => atom.type());
        }
        /**
         * Assemble a tuple for a [[AlloyField|field]].
         *
         * @remarks
         * The ID generated for a tuple in a field is the name of the first atom's
         * type followed by the list of atoms separated by arrows.
         *
         * @param element The XML tuple element
         * @param types The array of types for this tuple
         */
        static buildFieldTuple(element, types) {
            let atoms = AlloyTuple._getTupleAtoms(element, types);
            let id = types[0].id() + '<:' + atoms.map(a => a.name()).join('->');
            return new AlloyTuple(id, atoms);
        }
        /**
         * Assemble a tuple for a [[AlloySkolem|skolem]].
         *
         * @remarks
         * The ID generated for a tuple in a skolem is the name of the skolem
         * followed by the list of atoms separated by arrows.
         *
         * @param skolemName The name of the skolem
         * @param element The XML tuple element
         * @param types The array of types for this tuple
         */
        static buildSkolemTuple(skolemName, element, types) {
            let atoms = AlloyTuple._getTupleAtoms(element, types);
            let id = skolemName + '<:' + atoms.map(a => a.name()).join('->');
            return new AlloyTuple(id, atoms);
        }
        /**
         * Assemble the array of [[AlloyAtom|atoms]] that comprise a tuple.
         *
         * @param element The XML tuple element
         * @param types The array of types for this tuple
         * @private
         */
        static _getTupleAtoms(element, types) {
            let atomLabels = Array
                .from(element.querySelectorAll('atom'))
                .map(atom => atom.getAttribute('label'));
            if (atomLabels.includes(null))
                throw Error('Atom has no label attribute');
            let atoms = atomLabels.map((label, i) => types[i].findAtom(label));
            if (atoms.includes(null))
                throw Error('Unable to find all atoms in tuple');
            return atoms;
        }
    }

    class AlloyField extends AlloyElement {
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
        constructor(name, types, tuples, is_meta, is_private) {
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
        arity() {
            return this._types.length;
        }
        /**
         * Returns [[AlloyType.Field]]
         */
        expressionType() {
            return AlloyType.Field;
        }
        /**
         * Returns the unique ID of this field.
         *
         * @remarks
         * The unique ID of a field is constructed as the name of the type of the
         * first column of the relation, followed by a `<:`, followed by the name
         * of this field.
         */
        id() {
            return this._types[0].name() + '<:' + this.name();
        }
        /**
         * Returns true if this is a meta field, false otherwise.
         */
        is_meta() {
            return this._is_meta;
        }
        /**
         * Returns true if this is a private field, false otherwise.
         */
        is_private() {
            return this._is_private;
        }
        /**
         * Returns the signature that defines this field.
         */
        parent() {
            return this._types[0];
        }
        /**
         * Returns the number of "rows" in the relation defined by this field.
         */
        size() {
            return this._tuples.length;
        }
        /**
         * Returns a printable string.
         */
        toString() {
            return this.name();
        }
        /**
         * Returns a copy of this field's tuples.
         */
        tuples() {
            return this._tuples.slice();
        }
        /**
         * Returns a copy of the types that define the columns of this relation.
         */
        types() {
            return this._types.slice();
        }
        /**
         * Build all fields in an XML Alloy instance.
         *
         * @param elements An array of "field" elements from the XML file
         * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
         */
        static buildFields(elements, sigs) {
            let fields = new Map();
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
        static _buildField(element, sigs) {
            // Get and check field attributes
            let id = element.getAttribute('ID');
            let parentID = element.getAttribute('parentID');
            let label = element.getAttribute('label');
            let typesEl = element.querySelector('types');
            let meta = element.getAttribute('meta') === 'yes';
            let priv = element.getAttribute('private') === 'yes';
            if (!id)
                throw Error('Field has no ID attribute');
            if (!parentID)
                throw Error('Field has no parentID attribute');
            if (!label)
                throw Error('Field has no label attribute');
            if (!typesEl)
                throw Error('Field has no types');
            // Get the parent signature of the field
            let parent = sigs.get(parseInt(parentID));
            if (!parent)
                throw Error('Field parent type has not been created');
            // Get and check the types used in this field
            let typeIDs = Array
                .from(typesEl.querySelectorAll('type'))
                .map(el => el.getAttribute('ID'));
            if (typeIDs.includes(null))
                throw Error('Undefined type in field');
            let types = typeIDs.map(id => sigs.get(parseInt(id)));
            if (types.includes(undefined))
                throw Error('A field type has not been created');
            // Get and assemble the tuples
            let tuples = Array
                .from(element.querySelectorAll('tuple'))
                .map(el => AlloyTuple.buildFieldTuple(el, types));
            let field = new AlloyField(label, types, tuples, meta, priv);
            return {
                id: parseInt(id),
                field: field
            };
        }
    }

    (function (xml) {
        /**
         * Return a function that can be used to filter an array of Elements by
         * removing those with a specific "label" attribute value.
         *
         * @remarks
         * If the Element does not have a "label" attribute, it will be excluded.
         *
         * @param exclude The labels to exclude
         */
        function filterExcludeLabels(...exclude) {
            return (element) => {
                let label = element.getAttribute('label');
                if (!label)
                    return false;
                return !exclude.includes(label);
            };
        }
        xml.filterExcludeLabels = filterExcludeLabels;
        /**
         * Determine if the given element is a subset signature.
         *
         * @remarks
         * In an Alloy XML file, a subset signature will have a "type" element that
         * defines which signature it is a subset of.
         *
         * @param element The element to test
         */
        function isSubset(element) {
            return element.tagName === 'sig' && !!element.querySelector('type');
        }
        xml.isSubset = isSubset;
        /**
         * Comparison function that can be used to sort an array of subset sig elements
         * based on type hierarchy. Guarantees that parents will appear before children.
         * @param a A subset sig element from an Alloy XML file
         * @param b A subset sig element from an Alloy XML file
         */
        function sortSubset(a, b) {
            let aID = a.getAttribute('ID'), bID = b.getAttribute('ID'), aT = subsetTypeID(a), bT = subsetTypeID(b);
            if (!aID || !bID)
                throw Error('Element has no ID');
            if (bT === parseInt(aID))
                return -1;
            if (aT === parseInt(bID))
                return 1;
            return 0;
        }
        xml.sortSubset = sortSubset;
        /**
         * Get the parent ID of a subset signature
         * @param element The subset signature element
         */
        function subsetTypeID(element) {
            let t = element.querySelector('type');
            if (!t)
                throw Error('Element is not a subset signature');
            let id = t.getAttribute('ID');
            if (!id)
                throw Error('Element is not a subset signature');
            return parseInt(id);
        }
        xml.subsetTypeID = subsetTypeID;
    })(exports.xml || (exports.xml = {}));

    var filterExcludeLabels = exports.xml.filterExcludeLabels;
    var isSubset = exports.xml.isSubset;
    var sortSubset = exports.xml.sortSubset;
    var subsetTypeID = exports.xml.subsetTypeID;
    /**
     * A signature in an Alloy instance.
     *
     * @remarks
     * In Alloy, a signature introduces a set of atoms.
     */
    class AlloySignature extends AlloyElement {
        /**
         * Create a new Alloy signature.
         * @param name The name of this signature
         * @param is_builtin Is this a built-in signature?
         * @param is_meta Is this a meta signature?
         * @param is_one Is this a singleton signature?
         * @param is_private Is this a private signature?
         * @param is_subset Is this a subset signature?
         */
        constructor(name, is_builtin, is_meta, is_one, is_private, is_subset) {
            super(name);
            this._type = null;
            this._subtypes = [];
            this._atoms = [];
            this._fields = [];
            this._is_builtin = is_builtin ? is_builtin : false;
            this._is_meta = is_meta ? is_meta : false;
            this._is_one = is_one ? is_one : false;
            this._is_private = is_private ? is_private : false;
            this._is_subset = is_subset ? is_subset : false;
        }
        /**
         * Returns an array of atoms whose type are this signature.
         *
         * @remarks
         * To return a list of atoms defined directly by this signature, omit the
         * optional nest parameter. To include atoms defined by this signature
         * and all subtypes of this signature, pass in a truthy value for the
         * nest parameter.
         *
         * @param nest Whether or not to recursively include atoms
         */
        atoms(nest) {
            return nest
                ? this.atoms()
                    .concat(this.subTypes(true)
                    .reduce((acc, cur) => acc.concat(cur.atoms()), []))
                : this._atoms.slice();
        }
        /**
         * Returns the depth of this signature within the signature hierarchy. The
         * root signature (typically univ) has depth zero.
         */
        depth() {
            return this.typeHierarchy().length - 1;
        }
        /**
         * Invokes the specified function for this signature and each descendant
         * signature in [breadth-first order](https://en.wikipedia.org/wiki/Breadth-first_search), such that a given signature is only
         * visited if all signatures of lesser depth have already been visited. The
         * specified function is passed the current signature.
         *
         * @param callback The function to call for each signature
         * @returns This signature is returned, allowing for method chaining.
         */
        each(callback) {
            let sig = this, current, next = [sig], children, i, n;
            do {
                current = next.reverse();
                next = [];
                while (!!(sig = current.pop())) {
                    callback(sig);
                    children = sig.subTypes();
                    if (children) {
                        for (i = 0, n = children.length; i < n; ++i) {
                            next.push(children[i]);
                        }
                    }
                }
            } while (next.length);
            return this;
        }
        /**
         * Invokes the specified function for this signature and each descendant
         * signature in [post-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Post-order), such that a given signature is only
         * visited after all of its descendants have already been visited. The
         * specified function is passed the current signature.
         *
         * @param callback The function to call for each signature
         * @returns This signature is returned, allowing for method chaining.
         */
        eachAfter(callback) {
            this._subtypes.forEach(child => {
                child.eachAfter(callback);
            });
            callback(this);
            return this;
        }
        /**
         * Invokes the specified function for this signature and each descendant
         * signature in [pre-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order), such that a given signature is only
         * visited after all of its ancestors have already been visited. The
         * specified function is passed the current signature.
         *
         * @remarks
         * As an example, to print the nested signature hierarchy:
         * ```javascript
         * let univ = ...; // retreive the univ signature
         * univ.eachBefore(sig => {
         *   console.log(' '.repeat(sig.depth()) + sig.name());
         * }
         * ```
         *
         * @param callback The function to call for each signature
         * @returns This signature is returned, allowing for method chaining.
         */
        eachBefore(callback) {
            callback(this);
            this._subtypes.forEach(child => {
                child.eachBefore(callback);
            });
            return this;
        }
        /**
         * Returns [[AlloyType.Signature]]
         */
        expressionType() {
            return AlloyType.Signature;
        }
        /**
         * Returns an array of fields that are declared by this signature.
         *
         * @remarks
         * In Alloy, a field is defined within a signature block. In doing so, the
         * first column on that field is established to have the type of that
         * signature.
         */
        fields() {
            return this._fields.slice();
        }
        /**
         * Returns the atom with the given name if it exists, otherwise null.
         *
         * @remarks
         * This method searches this signature as well as all descendant signatures
         * for the give atom using a breadth-first search algorithm.
         *
         * @param name The name of the atom
         */
        findAtom(name) {
            let sig = this, current, next = [sig], children, i, n, atom;
            do {
                current = next.reverse();
                next = [];
                while (!!(sig = current.pop())) {
                    atom = sig._atoms.find(atom => atom.name() === name);
                    if (atom)
                        return atom;
                    children = sig.subTypes();
                    if (children) {
                        for (i = 0, n = children.length; i < n; ++i) {
                            next.push(children[i]);
                        }
                    }
                }
            } while (next.length);
            return null;
        }
        /**
         * Return the unique ID of this signature.
         *
         * @remarks
         * The unique ID of a signature is a combination of all signature names,
         * starting with the highest level parent and ending with this one, of all
         * signatures in this signature's ancenstry.
         */
        id() {
            return this.name();
        }
        /**
         * Returns true if this is a builtin signature, false otherwise.
         *
         * @remarks
         * Builtin signatures include "univ", "int", "seq/int", "string".
         */
        isBuiltin() {
            return this._is_builtin;
        }
        /**
         * Returns true if this is a meta signature, false otherwise.
         */
        isMeta() {
            return this._is_meta;
        }
        /**
         * Returns true if this is a singleton signature, false otherwise.
         */
        isOne() {
            return this._is_one;
        }
        /**
         * Returns true if this is a private signature, false otherwise.
         */
        isPrivate() {
            return this._is_private;
        }
        /**
         * Returns true if this is a subset signature, false otherwise.
         */
        isSubset() {
            return this._is_subset;
        }
        /**
         * Returns the number of (non-nested) atoms defined by this signature.
         */
        size() {
            return this.atoms().length;
        }
        /**
         * Returns an array of signatures that are subtypes of this signature.
         *
         * @remarks
         * To return a list of immediate subtypes, omit the optional nest parameter.
         * To include all subtypes of this signature, including all of those that
         * are below this one in the inheritance tree, pass in a truthy value for
         * the nest parameter.
         *
         * @param nest Whether or not to recursively include subtypes
         */
        subTypes(nest) {
            return nest
                ? this.subTypes()
                    .concat(this._subtypes
                    .map(sig => sig.subTypes(true))
                    .reduce((acc, cur) => acc.concat(cur), []))
                : this._subtypes.slice();
        }
        /**
         * Returns a printable string.
         */
        toString() {
            return this.name();
        }
        /**
         * Return a array, in order from highest to lowest, of this signature's
         * ancestors.
         *
         * @remarks
         * The final element of the list will be this signature.
         */
        typeHierarchy() {
            let hierarchy = this._type ? this._type.typeHierarchy() : [];
            hierarchy.push(this);
            return hierarchy;
        }
        /**
         * Assign all fields in the given list to their respective parent signatures.
         *
         * @param fields The list of fields.
         */
        static assignFields(fields) {
            fields.forEach(field => {
                field.parent()._fields.push(field);
            });
        }
        /**
         * Build all signatures in an XML Alloy instance.
         *
         * @param bitwidth The bitwidth, which defines the number of integers
         * @param maxseq The maximum sequence length
         * @param sigs An array of "sig" elements from the XML file
         */
        static buildSigs(bitwidth, maxseq, sigs) {
            let ids = new Map();
            let parents = new Map();
            // Int and seq/Int don't actually include atoms in the XML file,
            // so they need to be assembled separately from the rest of the sigs.
            let intElement = sigs.find(el => el.getAttribute('label') === 'Int');
            let seqElement = sigs.find(el => el.getAttribute('label') === 'seq/Int');
            if (!intElement)
                throw Error('No Int signature found in XML');
            if (!seqElement)
                throw Error('No seq/Int signature found in XML');
            let int = AlloySignature._buildInt(bitwidth, intElement);
            let seq = AlloySignature._buildSeq(maxseq, seqElement, int.sig);
            ids.set(int.id, int.sig);
            ids.set(seq.id, seq.sig);
            parents.set(int.id, int.parentID);
            // Parse the non-subset signatures
            sigs
                .filter(filterExcludeLabels('Int', 'seq/Int'))
                .filter(el => !isSubset(el))
                .forEach(el => {
                let sig = AlloySignature._buildSig(el);
                ids.set(sig.id, sig.sig);
                if (sig.parentID)
                    parents.set(sig.id, sig.parentID);
            });
            sigs
                .filter(el => isSubset(el))
                .sort(sortSubset)
                .forEach(el => {
                let sig = AlloySignature._buildSub(el, ids);
                ids.set(sig.id, sig.sig);
                if (sig.parentID)
                    parents.set(sig.id, sig.parentID);
            });
            parents.forEach((parentID, sigID) => {
                let parent = ids.get(parentID);
                let sig = ids.get(sigID);
                if (!parent || !sig)
                    throw Error('Error parsing parents');
                sig._type = parent;
                parent._subtypes.push(sig);
            });
            return ids;
        }
        /**
         * Assemble the builtin Int signature.
         *
         * @remarks
         * The total number of integers will be equal to 2<sup>bitwidth</sup>, and
         * the values will fall into the range
         * [-2<sup>bitwidth</sup>/2, 2<sup>bitwidth</sup>/2].
         *
         * @param bitwidth The bitwidth
         * @param element The XML sig element with the "Int" label attribute
         * @private
         */
        static _buildInt(bitwidth, element) {
            if (!element)
                throw Error('Instance contains no Int element');
            if (bitwidth < 1)
                throw Error(`Invalid bitwidth ${bitwidth}`);
            let id = element.getAttribute('ID');
            let parentID = element.getAttribute('parentID');
            if (!id)
                throw Error('Invalid Int element');
            if (!parentID)
                throw Error('Int is not part of the universe');
            let int = new AlloySignature('Int', true);
            let n = 2 ** bitwidth;
            for (let i = -n / 2; i < n / 2; ++i) {
                int._atoms.push(new AlloyAtom(int, i.toString()));
            }
            return {
                id: parseInt(id),
                parentID: parseInt(parentID),
                sig: int
            };
        }
        /**
         * Assemble the builtin seq/Int signature.
         *
         * @param maxseq The maximum sequence length
         * @param element The XML sig element with the "seq/Int" label attribute
         * @param int The Int signature
         * @private
         */
        static _buildSeq(maxseq, element, int) {
            if (!element)
                throw Error('Instance contains no seq/Int element');
            let id = element.getAttribute('ID');
            if (!id)
                throw Error('Invalid seq/Int element');
            let seq = new AlloySignature('seq/Int', true, false, false, false, true);
            seq._type = int;
            for (let i = 0; i < maxseq; ++i) {
                let atom = int.findAtom(i.toString());
                if (!atom)
                    throw Error('The maxseq value is invalid');
                seq._atoms.push(atom);
            }
            return {
                id: parseInt(id),
                sig: seq
            };
        }
        /**
         * Assemble a signature from an element of an XML file.
         *
         * @remarks
         * This method will not assemble subset signatures, as those require a
         * reference to their parent signature in order to extract existing atoms.
         *
         * @param element The XML sig element
         * @private
         */
        static _buildSig(element) {
            if (!element)
                throw Error('Signature element does not exist');
            let id = element.getAttribute('ID');
            if (!id)
                throw Error('Signature element has no ID attribute');
            let label = element.getAttribute('label');
            if (!label)
                throw Error('Signature element has no label attribute');
            let parentID = element.getAttribute('parentID');
            let builtin = element.getAttribute('builtin') === 'yes';
            let meta = element.getAttribute('meta') === 'yes';
            let one = element.getAttribute('one') === 'yes';
            let priv = element.getAttribute('private') === 'yes';
            let subset = isSubset(element);
            if (subset)
                throw Error('Subset signature must be built using AlloySignature._buildSub()');
            let sig = new AlloySignature(label, builtin, meta, one, priv, subset);
            element
                .querySelectorAll('atom')
                .forEach(atom => {
                let atomLabel = atom.getAttribute('label');
                if (!atomLabel)
                    throw Error('Atom does not have a label');
                sig._atoms.push(new AlloyAtom(sig, atomLabel));
            });
            if (parentID) {
                return {
                    id: parseInt(id),
                    parentID: parseInt(parentID),
                    sig: sig
                };
            }
            else {
                return {
                    id: parseInt(id),
                    sig: sig
                };
            }
        }
        /**
         * Assemble a subset signature from an element of an XML file.
         *
         * @remarks
         * This method assumes that the subset's parent signature has already been
         * created and is in the sigs map. Therefore, it's important to parse subset
         * signatures in a top-down fashion.
         *
         * @param element The XML sig element
         * @param sigs Map of sig ID's (as defined in XML) to signatures
         * @private
         */
        static _buildSub(element, sigs) {
            if (!element)
                throw Error('Signature element does not exist');
            let id = element.getAttribute('ID');
            if (!id)
                throw Error('Signature element has no ID attribute');
            let label = element.getAttribute('label');
            if (!label)
                throw Error('Signature element has no label attribute');
            let parentID = subsetTypeID(element);
            let builtin = element.getAttribute('builtin') === 'yes';
            let meta = element.getAttribute('meta') === 'yes';
            let one = element.getAttribute('one') === 'yes';
            let priv = element.getAttribute('private') === 'yes';
            let subset = isSubset(element);
            if (!subset)
                throw Error('Signatures must be built using AlloySignature._buildSig()');
            let parent = sigs.get(parentID);
            if (!parent)
                throw Error('Unable to find parent of subset signature');
            let sig = new AlloySignature(label, builtin, meta, one, priv, subset);
            element
                .querySelectorAll('atom')
                .forEach(el => {
                let atomLabel = el.getAttribute('label');
                if (!atomLabel)
                    throw Error('Atom does not have a label');
                let atom = parent.findAtom(atomLabel);
                if (!atom)
                    throw Error(`Parent signature doesn not contain atom ${atomLabel}`);
                sig._atoms.push(atom);
            });
            return {
                id: parseInt(id),
                parentID: parentID,
                sig: sig
            };
        }
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
    class AlloySkolem extends AlloyElement {
        /**
         * Create a new Alloy skolem.
         *
         * @param name The name of this skolem
         * @param types The types that define the columns of this skolem
         * @param tuples The contents of this skolem
         */
        constructor(name, types, tuples) {
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
        arity() {
            return this._types.length;
        }
        /**
         * Returns [[AlloyType.Skolem]]
         */
        expressionType() {
            return AlloyType.Skolem;
        }
        /**
         * Returns the unique ID of this skolem.
         *
         * @remarks
         * The unique ID of a skolem is also its name, as Alloy generates unique
         * names for all skolemized variables.
         */
        id() {
            return this.name();
        }
        /**
         * Returns the number of "rows" in this skolem.
         *
         * @remarks
         * Skolems that are scalars will have a size of one.
         */
        size() {
            return this._tuples.length;
        }
        /**
         * Returns a printable string.
         */
        toString() {
            return this.name();
        }
        /**
         * Returns a copy of this skolem's tuples.
         */
        tuples() {
            return this._tuples.slice();
        }
        /**
         * Returns a copy of the types that define the columns of this skolem.
         */
        types() {
            return this._types.slice();
        }
        /**
         * Build all skolems in an XML Alloy instance
         * @param elements An array of "skolem" elements from the XML file
         * @param sigs A map of signature IDs (as assigned in the XML file) to signatures
         * @param flds A map of field IDs (as assigned in the XML file) to fields
         */
        static buildSkolem(elements, sigs, flds) {
            let skolems = new Map();
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
        static _buildSkolem(element, sigs, flds) {
            // Get and check skolem attributes
            let id = element.getAttribute('ID');
            let label = element.getAttribute('label');
            let typesEl = element.querySelector('types');
            if (!id)
                throw Error('Skolem has no ID attribute');
            if (!label)
                throw Error('Skolem has no label attribute');
            if (!typesEl)
                throw Error('Skolem has no type(s)');
            // Get and check the types of this skolem
            let typeIDs = Array
                .from(typesEl.querySelectorAll('type'))
                .map(el => el.getAttribute('ID'));
            if (typeIDs.includes(null))
                throw Error('Undefined type in skolem');
            let types = typeIDs.map(id => sigs.get(parseInt(id)));
            if (types.includes(undefined))
                throw Error('A skolem type has not been created');
            // Get and assemble the tuples
            let tuples = Array
                .from(element.querySelectorAll('tuple'))
                .map(el => AlloyTuple.buildSkolemTuple(label, el, types));
            // Create the skolem
            let skolem = new AlloySkolem(label, types, tuples);
            // Inject the skolem into witnesses
            if (types.length === 1) {
                // A set of atoms, so tell each atom that it's part of this skolem
                tuples.forEach((tuple) => {
                    tuple.atoms().forEach((atom) => {
                        AlloyAtom.addSkolem(atom, skolem);
                    });
                });
            }
            else if (types.length > 1) {
                // A set of tuples, so tell each tuple that it's part of this skolem
                Array.from(flds.values())
                    .forEach((field) => {
                    field.tuples().forEach((tuple) => {
                        let eqv = tuples.find((value) => tuple.equals(value));
                        if (eqv) {
                            AlloyTuple.addSkolem(tuple, skolem);
                        }
                    });
                });
            }
            return {
                id: parseInt(id),
                skolem: skolem
            };
        }
    }

    class AlloySource {
        /**
         * Create a new source by extracting the Alloy source code from an XML
         * element.
         *
         * @param filename The source filename
         * @param source The source code
         */
        constructor(filename, source) {
            this._filename = filename;
            this._source = source;
        }
        /**
         * Return the full file path this source comes from.
         */
        filename() {
            return this._filename;
        }
        /**
         * Return the Alloy source code.
         */
        source() {
            return this._source;
        }
        /**
         * Create a new source by extracting the Alloy source code from an XML
         * element.
         *
         * @param element The XML element containing a "filename" attribute and a
         * "content" attribute.
         */
        static fromElement(element) {
            let filename = element.getAttribute('filename');
            let source = element.getAttribute('content');
            if (!filename)
                throw Error('No filename attribute in XML file');
            if (!source)
                throw Error('No source attribute in XML file');
            return new AlloySource(filename, source);
        }
    }

    class AlloyInstance {
        /**
         * Assemble an Alloy instance from an XML document.
         *
         * @remarks
         * Extracts and parses all info from an instance that has been exported
         * from Alloy in XML format. The plain text read from the XML file is passed
         * to the constructor; all XML parsing is performed automatically.
         *
         * @param text The text from an Alloy XML file.
         */
        constructor(text) {
            this._bitwidth = 0;
            this._builddate = new Date(0);
            this._command = '';
            this._filename = '';
            this._maxseq = 0;
            this._sources = [];
            let parser = new DOMParser();
            let document = parser.parseFromString(text, 'application/xml');
            this._parseAlloyAttributes(document.querySelector('alloy'));
            this._parseInstanceAttributes(document.querySelector('instance'));
            this._parseSourceCode(Array.from(document.querySelectorAll('source')));
            let sigElements = Array.from(document.querySelectorAll('sig'));
            let fldElements = Array.from(document.querySelectorAll('field'));
            let skoElements = Array.from(document.querySelectorAll('skolem'));
            let sigs = AlloySignature
                .buildSigs(this._bitwidth, this._maxseq, sigElements);
            let fields = AlloyField
                .buildFields(fldElements, sigs);
            let skolems = AlloySkolem
                .buildSkolem(skoElements, sigs, fields);
            AlloySignature.assignFields(Array.from(fields.values()));
            this._signatures = Array.from(sigs.values());
            this._fields = Array.from(fields.values());
            this._skolems = Array.from(skolems.values());
            this._xml = new AlloySource('XML', text);
        }
        /**
         * Return an array of all atoms in this instance.
         */
        atoms() {
            return this.signatures()
                .filter(sig => !sig.isSubset())
                .map(sig => sig.atoms())
                .reduce((acc, cur) => acc.concat(cur), []);
        }
        /**
         * Return the bitwidth of this instance.
         */
        bidwidth() {
            return this._bitwidth;
        }
        /**
         * Return this build date of Alloy that generated this instance.
         */
        builddate() {
            return new Date(this._builddate.getTime());
        }
        /**
         * Return the command used to generate this instance.
         */
        command() {
            return this._command;
        }
        /**
         * Return an array of all fields in this instance.
         */
        fields() {
            return this._fields.slice();
        }
        /**
         * Return the full path of the file that was used to generate this instance.
         */
        filename() {
            return this._filename;
        }
        /**
         * Return the maximum sequence length.
         */
        maxseq() {
            return this._maxseq;
        }
        /**
         * Return an array of all signatures in this instance.
         */
        signatures() {
            return this._signatures.slice();
        }
        /**
         * Return an array of all skolems in this instance.
         */
        skolems() {
            return this._skolems.slice();
        }
        /**
         * Return an array of all Alloy source files that define the model from
         * which this instance was created.
         */
        sources() {
            return this._sources.slice();
        }
        /**
         * Return an array of all tuples in this instance.
         *
         * @param includeSkolem If true, skolem tuples will be included, if false,
         * they will not be included.
         */
        tuples(includeSkolem = false) {
            let skolems = includeSkolem
                ? this.skolems()
                    .map(skolem => skolem.tuples())
                    .reduce((acc, cur) => acc.concat(cur), [])
                : [];
            let fields = this.fields()
                .map(field => field.tuples())
                .reduce((acc, cur) => acc.concat(cur), []);
            return fields.concat(skolems);
        }
        /**
         * Returns the "univ" signature, of which all other signatures are children.
         * If no "univ" signature is present, returns undefined.
         */
        univ() {
            return this._signatures.find(s => s.name() === 'univ');
        }
        /**
         * Return the XML file that was used to construct this instance. The
         * filename of the returned [[AlloySource]] will be "XML".
         */
        xml() {
            return this._xml;
        }
        /**
         * Parse the attributes of the "alloy" XML element
         *
         * @remarks
         * This method sets the [[_builddate]] property.
         *
         * @param element The "alloy" XML element
         * @throws Error if element is null or does not have a builddate attribute.
         * @private
         */
        _parseAlloyAttributes(element) {
            if (!element)
                throw Error('Instance does not contain Alloy info');
            let builddate = element.getAttribute('builddate');
            if (!builddate)
                throw Error('Instance does not contain an Alloy build date');
            this._builddate = new Date(Date.parse(builddate));
        }
        /**
         * Parse the attributes of the "instance" XML element
         *
         * @remarks
         * This method sets the [[_bitwidth]], [[_maxseq]], [[_command]], and
         * [[_filename]] properties.
         *
         * @param element The "instance" XML element
         * @throws Error if element is null or any of bitwidth, maxseq, command, or
         * filename attributes are not present.
         * @private
         */
        _parseInstanceAttributes(element) {
            if (!element)
                throw Error('Instance does not contain attribute info');
            let bitwidth = element.getAttribute('bitwidth');
            if (!bitwidth)
                throw Error('Instance does not contain a bit width');
            this._setBitWidth(parseInt(bitwidth));
            let maxseq = element.getAttribute('maxseq');
            if (!maxseq)
                throw Error('Instance does not contain a max seq');
            this._setMaxSeq(parseInt(maxseq));
            let command = element.getAttribute('command');
            if (!command)
                throw Error('Instance does not contain a command');
            this._setCommand(command);
            let filename = element.getAttribute('filename');
            if (!filename)
                throw Error('Instance does not contain a filename');
            this._setFilename(filename);
        }
        /**
         * Parse the "source" XML elements, retrieving all source code used to
         * create this instance.
         *
         * @param elements The array our "source" elements
         * @private
         */
        _parseSourceCode(elements) {
            this._sources = elements.map(element => AlloySource.fromElement(element));
        }
        /**
         * Set the [[_bitwidth]] attribute
         * @param bitwidth The bitwidth
         * @private
         */
        _setBitWidth(bitwidth) {
            this._bitwidth = bitwidth;
        }
        /**
         * Set the [[_command]] attribute
         * @param command The command
         * @private
         */
        _setCommand(command) {
            this._command = command;
        }
        /**
         * Set the [[_filename]] attribute
         * @param filename The filename
         * @private
         */
        _setFilename(filename) {
            this._filename = filename;
        }
        /**
         * Set the [[_maxseq]] attribute
         * @param maxseq The max seq length
         * @private
         */
        _setMaxSeq(maxseq) {
            this._maxseq = maxseq;
        }
    }

    (function (filtering) {
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only [[AlloyAtom|atoms]].
         * @param item The current item being tested.
         */
        function keepAtoms(item) {
            return item.expressionType() === AlloyType.Atom;
        }
        filtering.keepAtoms = keepAtoms;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only builtin [[AlloySignature|signatures]].
         * @param item The current item being tested
         */
        function keepBuiltins(item) {
            return item.expressionType() === AlloyType.Signature && item.isBuiltin();
        }
        filtering.keepBuiltins = keepBuiltins;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only items that are considered empty (i.e. their size is zero).
         * @param item
         */
        function keepEmptys(item) {
            return item.size() === 0;
        }
        filtering.keepEmptys = keepEmptys;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only [[AlloyField|fields]].
         * @param item The current item being tested.
         */
        function keepFields(item) {
            return item.expressionType() === AlloyType.Field;
        }
        filtering.keepFields = keepFields;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only [[AlloySignature|signatures]].
         * @param item The current item being tested.
         */
        function keepSignatures(item) {
            return item.expressionType() === AlloyType.Signature;
        }
        filtering.keepSignatures = keepSignatures;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only [[AlloySkolem|skolems]].
         * @param item The current item being tested.
         */
        function keepSkolems(item) {
            return item.expressionType() === AlloyType.Skolem;
        }
        filtering.keepSkolems = keepSkolems;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by keeping only [[AlloyTuple|tuples]].
         * @param item The current item being tested.
         */
        function keepTuples(item) {
            return item.expressionType() === AlloyType.Tuple;
        }
        filtering.keepTuples = keepTuples;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only [[AlloyAtom|atoms]].
         * @param item The current item being tested.
         */
        function removeAtoms(item) {
            return item.expressionType() !== AlloyType.Atom;
        }
        filtering.removeAtoms = removeAtoms;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only builtin [[AlloySignature|signatures]].
         * @param item The current item being tested
         */
        function removeBuiltins(item) {
            return !(item.expressionType() === AlloyType.Signature && item.isBuiltin());
        }
        filtering.removeBuiltins = removeBuiltins;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only items that are considered empty (i.e. their size is zero).
         * @param item
         */
        function removeEmptys(item) {
            return item.size() > 0;
        }
        filtering.removeEmptys = removeEmptys;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only [[AlloyField|fields]].
         * @param item The current item being tested.
         */
        function removeFields(item) {
            return item.expressionType() !== AlloyType.Field;
        }
        filtering.removeFields = removeFields;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only [[AlloySignature|signatures]].
         * @param item The current item being tested.
         */
        function removeSignatures(item) {
            return item.expressionType() !== AlloyType.Signature;
        }
        filtering.removeSignatures = removeSignatures;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only [[AlloySkolem|skolems]].
         * @param item The current item being tested.
         */
        function removeSkolems(item) {
            return item.expressionType() !== AlloyType.Skolem;
        }
        filtering.removeSkolems = removeSkolems;
        /**
         * Function that can be used to filter an array of [[AlloyElement|elements]]
         * by removing only [[AlloyTuple|tuples]].
         * @param item The current item being tested.
         */
        function removeTuples(item) {
            return item.expressionType() !== AlloyType.Tuple;
        }
        filtering.removeTuples = removeTuples;
    })(exports.filtering || (exports.filtering = {}));

    (function (sorting) {
        /**
         * Return a function that can be used in Array.sort() to sort alphabetically.
         * @param name The function that will be used to retrieve the name of each item.
         * If no function is provided, AlloyElement.name() will be used.
         * @param ascending True (default) to sort in ascending order, false to sort in
         * descending order.
         */
        function alphabeticalSort(name, ascending = true) {
            const one = ascending ? 1 : -1;
            name = name ? name : (item) => item.name();
            return (a, b) => {
                const aname = name(a);
                const bname = name(b);
                if (aname < bname)
                    return -one;
                if (bname < aname)
                    return one;
                return 0;
            };
        }
        sorting.alphabeticalSort = alphabeticalSort;
        /**
         * Return a function that can be used in Array.sort() to sort Alloy items
         * based on whether or not they are builtins. Only signatures can be "builtins"
         * so only signatures are affected by this sort function.
         * @param builtinLast Sort so that builtins are moved to the end of the array
         */
        function builtinSort(builtinLast = true) {
            const one = builtinLast ? 1 : -1;
            return (a, b) => {
                const aSig = a.expressionType() === 'signature';
                const bSig = b.expressionType() === 'signature';
                if (aSig === bSig) {
                    if (!aSig)
                        return 0;
                    const aB = a.isBuiltin();
                    const bB = b.isBuiltin();
                    return aB === bB ? 0 : aB ? one : -one;
                }
                else {
                    const aB = aSig && a.isBuiltin();
                    const bB = bSig && b.isBuiltin();
                    return aB ? one : bB ? -one : 0;
                }
            };
        }
        sorting.builtinSort = builtinSort;
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
        function groupSort(groups) {
            groups = groups || [
                AlloyType.Signature,
                AlloyType.Atom,
                AlloyType.Field,
                AlloyType.Tuple,
                AlloyType.Skolem
            ];
            return (a, b) => {
                return groups.indexOf(a.expressionType()) - groups.indexOf(b.expressionType());
            };
        }
        sorting.groupSort = groupSort;
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
        function sizeSort(ascending = true) {
            const one = ascending ? 1 : -1;
            return (a, b) => {
                return (a.size() - b.size()) * one;
            };
        }
        sorting.sizeSort = sizeSort;
    })(exports.sorting || (exports.sorting = {}));

    exports.AlloyAtom = AlloyAtom;
    exports.AlloyElement = AlloyElement;
    exports.AlloyField = AlloyField;
    exports.AlloyInstance = AlloyInstance;
    exports.AlloySignature = AlloySignature;
    exports.AlloySkolem = AlloySkolem;
    exports.AlloySource = AlloySource;
    exports.AlloyTuple = AlloyTuple;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
