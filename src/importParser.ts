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

import * as ts from "typescript";

import { findNode, findNodes, getModulePath, hasNode } from "./tsUtils";

export interface IImportData {
    localName: string;
    propertyName?: string;
    importPath: string;
    startPosition: number;
}

export function parseImport(node: ts.ImportDeclaration) {
    const importData: IImportData[] = [];
    const importPath = getModulePath(node.moduleSpecifier);
    const startPosition = node.pos;

    if (hasNode(node, ts.SyntaxKind.NamespaceImport)) {
        // import * as Foo from...
        const namespaceImport = <ts.NamespaceImport>findNode(node, ts.SyntaxKind.NamespaceImport);
        importData.push({
            localName: namespaceImport.name.text,
            importPath,
            startPosition,
        });
    } else if (hasNode(node, ts.SyntaxKind.NamedImports)) {
        // import {foo, bar as car} from...
        const importSpecifiers = <ts.ImportSpecifier[]>findNodes(node, ts.SyntaxKind.ImportSpecifier);
        for (const importSpecifier of importSpecifiers) {
            const localName = importSpecifier.name.text;
            const propertyName = importSpecifier.propertyName ? importSpecifier.propertyName.text : localName;
            importData.push({
                localName,
                propertyName,
                importPath,
                startPosition,
            });
        }
    } else if (node.importClause != null) {
        // import aliasOfDefaultExport from ...
        importData.push({
            localName: node.importClause.name.text,
            propertyName: "default",
            importPath,
            startPosition,
        });
    }

    return importData;
}
