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

export function findNodes(node: ts.Node, kind: ts.SyntaxKind, matches?: ts.Node[]) {
    if (matches == null) {
        matches = [];
    }
    ts.forEachChild(node, (child) => {
        if (child.kind === kind) {
            matches.push(child);
        }
        findNodes(child, kind, matches);
    });
    return matches;
}

export function findNode(node: ts.Node, kind: ts.SyntaxKind) {
    const nodes = findNodes(node, kind);
    if (nodes.length !== 1) {
        throw new Error("More than one matching node found");
    }
    return nodes[0];
}

export function getModulePath(moduleSpecifier: ts.Expression) {
    return moduleSpecifier.getText().replace(/["']/g, "");
}

export function hasNode(node: ts.Node, kind: ts.SyntaxKind) {
    return findNodes(node, kind).length > 0;
}
