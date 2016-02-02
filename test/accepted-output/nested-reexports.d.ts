declare namespace __Namespace.__Module1 {
export  class someClass {
}
}
declare namespace __Namespace.__Dir1.__Dir1_1.__Module4 {
export interface Mod4_A {
}
export interface Mod4_B {
}
}
declare namespace __Namespace.__Dir1.__Dir1_1.__Module3 {
export interface Mod3 {
}
}
declare namespace __Namespace.__Dir1.__Module2 {
import Mod4 = __Namespace.__Dir1.__Dir1_1.__Module4;
export  const foo: Mod4.Mod4_A;

export import mod3 = __Namespace.__Dir1.__Dir1_1.__Module3.Mod3;
}
declare namespace Namespace {
import classy = __Namespace.__Module1.someClass;import mod3 = __Namespace.__Dir1.__Module2.mod3;
export  let myVar: classy;

export  let myVar2: mod3;
}
