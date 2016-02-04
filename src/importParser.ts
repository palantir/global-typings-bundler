/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 */

import * as ts from "typescript";

import { hasNode, findNode, findNodes } from "./tsUtils";

export interface IImportData {
    localName: string;
    propertyName?: string;
    importPath: string;
    startPosition: number;
}

export function parseImport(node: ts.ImportDeclaration) {
    const importData: IImportData[] = [];
    const importPath = node.moduleSpecifier.getText().replace(/"/g, "");
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
