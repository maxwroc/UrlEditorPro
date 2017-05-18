module Tests {
    export function all(description, callArguments: any[][], testFunction: Function) {
        callArguments.forEach(args => {
            it(`${description}; Case: ${JSON.stringify(args)}`, () => {
                testFunction.apply(null, args);
            });
        });
    }
}