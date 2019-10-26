import { AlloyElement } from './core/AlloyElement';

export type AlloyNameFn = (item: AlloyElement) => string;
export type AlloySortFn = (a: AlloyElement, b: AlloyElement) => number;

export enum AlloyType {
    Atom = 'atom',
    Field = 'field',
    Signature = 'signature',
    Skolem = 'skolem',
    Tuple = 'tuple'
}
