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

import { hasNode, findNodes } from "./tsUtils";

export interface IExportData {
    fromPath?: string;
    exportName: string;
    propertyName?: string;
    startPosition: number;
}

export function parseExport(exportDecl: ts.ExportDeclaration) {
    const exportData: IExportData[] = [];
    const moduleSpecifier = exportDecl.moduleSpecifier;
    const hasNamedExports = hasNode(exportDecl, ts.SyntaxKind.NamedExports);
    const startPosition = exportDecl.pos;

    if (!hasNamedExports && moduleSpecifier != null) {
        // export * from ...
        throw new Error("`export * from ...` exports are not supported.");
    } else if (hasNamedExports && moduleSpecifier == null) {
        // export {name, name2 as name2};
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
