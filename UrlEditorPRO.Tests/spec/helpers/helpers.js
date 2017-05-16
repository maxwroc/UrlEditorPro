var Tests;
(function (Tests) {
    function all(description, callArguments, testFunction) {
        callArguments.forEach(function (args) {
            it(description + "; Case: " + JSON.stringify(args), function () {
                testFunction.apply(null, args);
            });
        });
    }
    Tests.all = all;
})(Tests || (Tests = {}));
//# sourceMappingURL=helpers.js.map