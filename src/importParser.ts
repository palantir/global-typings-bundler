/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 */

import * as ts from "typescript";

import { hasNode, findNode, findNodes } from "./tsUtils";

export interface ImportData {
    localName: string;
    propertyName?: string;
    importPath: string;
    startPosition: number;
}

export function parseImport(node: ts.ImportDeclaration) {
    const importData: ImportData[] = [];
    const importPath = node.moduleSpecifier.getText().replace(/"/g, "");
    const startPosition = node.pos;

    // import is in "import * as Foo from..." form
    if (hasNode(node, ts.SyntaxKind.NamespaceImport)) {
        const namespaceImport = <ts.NamespaceImport>findNode(node, ts.SyntaxKind.NamespaceImport);
        importData.push({
            localName: namespaceImport.name.text,
            importPath,
            startPosition,
        });
    } else if (hasNode(node, ts.SyntaxKind.NamedImports)) {
        // import is in "import {foo, bar as car} from..." form
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
        // presumably in "impot something from..." form
        importData.push({
            localName: node.importClause.name.text,
            propertyName: "default",
            importPath,
            startPosition,
        });
    }

    return importData;
}
