"use strict"
var chai = require('chai');
var sinon = require('sinon');
var fontwr = require('../index.js');
var assert = chai.assert;

it("returns the return value from the original function", function () {
    var myAPI = { method: function () {} };

    var mock = sinon.mock(myAPI);
    mock.expects("method").once();
    myAPI.method();

    mock.verify();
});