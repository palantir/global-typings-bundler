declare namespace __Namespace.__Module1 {
export interface Foo {
}
}
declare namespace __Namespace.__Module2 {
export  const Bar: number;
}
declare namespace Namespace {


export  const Engine: number;
export import Foo = __Namespace.__Module1.Foo;
export import Car = __Namespace.__Module2.Bar;
}
