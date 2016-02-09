/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

import { findNodes } from "./tsUtils";
import { IExportData, parseExport } from "./exportParser";
import { IImportData, parseImport } from "./importParser";

interface IFileData {
    contents: string;
    namespaceName: string;
    dependencies: string[];
    imports: IImportData[];
    exports: IExportData[];
    textSpansToDelete: TextSpan[];
}
type TextSpan = [number, number];
type IFileDataMap = { [path: string]: IFileData };

/**
 * A map from external module names to the corresponding global variable when the module is bundled for browser usage.
 */
export type IExternals = { [moduleName: string]: string };

/**
 * Bundles external module typings into a single .d.ts file that exposes a global namespace.
 *
 * @param globalName The name of the desired global namespace
 * @param typingsEntryPoint Path to the typings file for the module's entry point
 * @param externals An object which maps external module names to their corresponding globals.
 *        For example, "react" would map to "React", "react-addons-test-utils" -> "React.addons.TestUtils", etc.
 * @returns the contents of the bundled typings file as a string
 */
export function bundleTypings(globalName: string, typingsEntryPoint: string, externals?: IExternals): string {
    externals = externals || {};
    const rootModulePath = path.basename(typingsEntryPoint, ".d.ts");
    const cwd = path.dirname(typingsEntryPoint);
    const oldCWD = process.cwd();
    process.chdir(cwd);

    const fileDataMap = parseFileAndDeps(rootModulePath);
    const outputFileContents = generateOutput(fileDataMap, rootModulePath, globalName, externals);
    process.chdir(oldCWD);
    return outputFileContents;

    function parseFileAndDeps(modulePath: string, fileData?: IFileDataMap) {
        fileData = fileData || {};

        // already processed file
        if (fileData[modulePath] != null) { return; }

        fileData[modulePath] = parseFile(modulePath);
        for (const dependency of fileData[modulePath].dependencies) {
            parseFileAndDeps(dependency, fileData);
        }
        return fileData;
    }

    function parseFile(modulePath: string, isRootModule = false) {
        const filePath = modulePath + ".d.ts";
        const fileContents = fs.readFileSync(filePath, "utf8");

        const namespaceName = modulePath === rootModulePath ? globalName : pathToNamespace(modulePath);

        const source = ts.createSourceFile(path.basename(filePath), fileContents, ts.ScriptTarget.ES5, true);
        let imports: IImportData[] = [];
        let exports: IExportData[] = [];
        const textSpansToDelete: TextSpan[] = [];

        for (const importDecl of findNodes(source, ts.SyntaxKind.ImportDeclaration)) {
            imports = imports.concat(parseImport(<ts.ImportDeclaration>importDecl));
            textSpansToDelete.push([importDecl.getStart(), importDecl.getEnd()]);
        }

        for (const exportDecl of findNodes(source, ts.SyntaxKind.ExportDeclaration)) {
            exports = exports.concat(parseExport(<ts.ExportDeclaration>exportDecl));
            textSpansToDelete.push([exportDecl.getStart(), exportDecl.getEnd()]);
        }

        for (const declareKeyword of findNodes(source, ts.SyntaxKind.DeclareKeyword)) {
            textSpansToDelete.push([declareKeyword.getStart(), declareKeyword.getEnd()]);
        }

        textSpansToDelete.sort((a, b) => a[0] - b[0]);

        // convert dependencies from relative path to path from root
        // also check for external references which aren't defined in externals
        const dependencies = imports
            .map((i) => i.importPath)
            .concat(exports.map((e) => e.fromPath))
            .filter((p) => p != null)
            .filter((p, i, arr) => arr.indexOf(p) === i)
            .filter((p) => {
                if (!isRelative(p) && externals[p] == null) {
                    throw new Error(`Must define an external identifier for module "${p}"`);
                }
                return isRelative(p);
            })
            .map((p) => fullDependencyPath(modulePath, p));

        // convert import and export relative paths to paths from root
        imports
            .filter((i) => isRelative(i.importPath))
            .forEach((i) => i.importPath = fullDependencyPath(modulePath, i.importPath));
        exports
            .filter((e) => e.fromPath != null && isRelative(e.fromPath))
            .forEach((e) => e.fromPath = fullDependencyPath(modulePath, e.fromPath));

        return {
            contents: fileContents,
            namespaceName,
            dependencies,
            imports,
            exports,
            textSpansToDelete,
        };
    }
}

function generateOutput(fileDataMap: IFileDataMap,
                        rootModulePath: string,
                        rootNamespace: string,
                        externals?: IExternals) {
    let output = "";
    externals = externals || {};
    const processed: { [realPath: string]: boolean } = {};
    const rootPseudoNamespace = `__${rootNamespace}`;

    processFile(rootModulePath);
    return output;

    function processFile(modulePath: string) {
        if (processed[modulePath]) { return; }
        processed[modulePath] = true;

        const fileData = fileDataMap[modulePath];
        for (const dep of fileData.dependencies) {
            if (externals[dep] == null) {
                processFile(dep);
            }
        }

        let declareNS = modulePath === rootModulePath ? rootNamespace : `${rootPseudoNamespace}.${fileData.namespaceName}`;
        let fileOutput = `declare namespace ${declareNS} {\n`;
        for (const i of fileData.imports) {
            const ns = externals[i.importPath] || `${rootPseudoNamespace}.${fileDataMap[i.importPath].namespaceName}`;
            if (ns === i.localName && i.propertyName != null) {
                // avoid TS circular import warning would be thrown
                throw new Error(`Cannot do "import ${ns} = ${ns}.${i.propertyName}" for module ${modulePath}.`);
            } else if (ns === i.localName) {
                // skip import because TS won't let us do "import React = React" for example (and we have no need to).
                continue;
            }
            fileOutput += `import ${i.localName} = ${ns}${i.propertyName != null ? "." + i.propertyName : ""};`;
        }

        let body = fileData.contents;
        for (const [start, end] of fileData.textSpansToDelete.reverse()) {
            body = body.substring(0, start) + body.substring(end);
        }
        fileOutput += body;

        for (const e of fileData.exports) {
            const ns = externals[e.fromPath] || `${rootPseudoNamespace}.${fileDataMap[e.fromPath].namespaceName}`;
            fileOutput += `export import ${e.exportName} = ${ns}.${e.propertyName};\n`;
        }
        fileOutput += "}\n";

        output += fileOutput;
    }
}

function fullDependencyPath(modulePath: string, relativePath: string) {
    return path.join(modulePath, "../", relativePath);
}

function pathToNamespace(p: string) {
    const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.substr(1);
    return p.split("-").map(capitalizeFirst).join("").split("/").map(capitalizeFirst).map((s) => "__" + s).join(".");
}

function isRelative(p: string) {
    return p.charAt(0) === ".";
}
