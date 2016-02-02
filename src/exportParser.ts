import * as ts from "typescript";

import { hasNode, findNodes } from "./tsUtils";

export interface ExportData {
    fromPath?: string;
    exportName: string;
    propertyName?: string;
    startPosition: number;
}

export function parseExport(exportDecl: ts.ExportDeclaration) {
    const exportData: ExportData[] = [];
    const moduleSpecifier = exportDecl.moduleSpecifier;
    const hasNamedExports = hasNode(exportDecl, ts.SyntaxKind.NamedExports);
    const startPosition = exportDecl.pos;

    if (!hasNamedExports && moduleSpecifier != null) {
        // "export * from ..." format
        throw new Error("`export * from ...` exports are not supported.");
    } else if (hasNamedExports && moduleSpecifier == null) {
        // "export {name, name2 as name2};" format
        throw new Error("`export {name}` exports without a `from` clause are not supported.");
    } else if (hasNamedExports && moduleSpecifier != null) {
        const exportSpecifiers = <ts.ExportSpecifier[]>findNodes(exportDecl, ts.SyntaxKind.ExportSpecifier);
        for (const exportSpecifier of exportSpecifiers) {
            const exportName = exportSpecifier.name.text;
            const propertyName = exportSpecifier.propertyName ? exportSpecifier.propertyName.text : exportName;
            exportData.push({
                fromPath: moduleSpecifier.getText().replace(/"/g, ""),
                exportName,
                propertyName,
                startPosition,
            });
        }
    } else {
        throw new Error("Unrecognized export declaration.");
    }

    return exportData;
}
