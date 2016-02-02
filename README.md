## Global Typings Bundler

[![Circle CI](https://circleci.com/gh/palantir/global-typings-bundler.svg?style=svg&circle-token=7aa0422260d471482bcbc9719d609e530f32ccda)](https://circleci.com/gh/palantir/global-typings-bundler)

Bundles your TypeScript definition files, like a JS module bundler does for your source files.

### Input

Granular external module definition files as generated with `tsc --module commonjs`:

```
my-module/
├── foo.d.ts
├── bar.d.ts
├── index.d.ts
└── someFolder/
    └── nestedModule.d.ts
```

```ts
// index.d.ts
export { IFoo, parseExport } from "./foo";
export { IBar } from "./bar";
```

```ts
// foo.d.ts
import * as ts from "typescript";
import { someGlobalVariable } from "./someFolder/nestedModule";
export interface IFoo {
    ...
}
export function parseExport(exportDecl: ts.ExportDeclaration): IFoo[] {
    ...
}
```

```ts
// someFolder/nestedModule.d.ts
export const someGlobalVariable: string;
```

### Output

A flattened `.d.ts` file that matches the shape of the namespaces created by a JS bundler like webpack or browserify:

```ts
declare namespace __MyModule.__SomeFolder.__NestedModule {
    export const someGlobalVariable: string;
}
declare namespace __MyModule.__Foo {
    import someGlobalVariable = __MyModule.__SomeFolder.__NestedModule.someGlobalVariable;
    export interface IFoo {
        ...
    }
    export declare function parseExport(exportDecl: ts.ExportDeclaration): IFoo[];
}
declare namespace MyModule {
    export import IFoo = __MyModule.__Foo.IFoo;
    export import parseExport = __MyModule.__Foo.parseExport;
    export import IBar = __MyModule.__Bar.IBar;
}
```

The `__` namespaces are fake and do not correspond to real values at runtime in JS.

#### Motivation

As we transitioned our TypeScript libraries to ES6 module syntax and our applications to use a JS module loader,
we wanted to retain interoperability with older applications that did not use a module loader or bundler. This
is easy to do for the JS -- you simply bundle using a tool like webpack and you're ready to use the browser-global
version of the library with a package manager like Bower. However, the typings generated by the compiler are unusable
in these legacy applications because of the lack of module loader (they can't have any external module imports/exports).
So, we built this tool to bridge the gap. It allows you to author a TypeScript library in ES6 module syntax and
distribute it as a strongly typed CommonJS module on NPM as well as a strongly typed global module on Bower.

#### Caveats

TODO

#### Code Structure

TODO

#### Development

```
npm run lint
npm run build
```

#### Distribution

Publishing to NPM:

```
npm run all
npm publish dist/
```
