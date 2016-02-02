/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
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

export function hasNode(node: ts.Node, kind: ts.SyntaxKind) {
    return findNodes(node, kind).length > 0;
}
