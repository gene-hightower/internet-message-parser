"use strict";

const assert = require("assert");

const { parse } = require("../lib/index.js");

describe("try anything", function () {
    it("parse an atom", function () {
        const atom = parse('atom', 'foo');
        expect(atom).toEqual({atom: 'foo'});
    });
});
