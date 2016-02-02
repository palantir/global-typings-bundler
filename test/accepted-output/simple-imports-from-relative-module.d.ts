declare namespace __Namespace.__Module1 {
export interface Foo {
}
}
declare namespace Namespace {
import Foo = __Namespace.__Module1.Foo;
export  const foo: Foo;
export  const bar: number;
}
