"use strict";

const assert = require("assert");

const { parse } = require("../lib/index.js");

describe("try anything", function () {
  it("parse an atom", function () {
    const atom = parse("atom", "foo");
    expect(atom).toEqual({ atom: "foo" });
  });

  it("parse a mailbox-list", function () {
    const mbl = parse(
      "mailbox_list",
      '"Gene Q Hightower" <gene@digilicious.com>, Max Power <abc@xyz.org>'
    );
    console.log(JSON.stringify(mbl));
    // expect(mbl).toEqual({mbl: ''});
  });
});
