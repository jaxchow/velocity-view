module.exports = function(Layout, utils) {

    function getLayoutVal(asts, defaultVal) {
        var value;
        asts.forEach(function(ast) {
            if (ast.type == "set") {

                if (ast.equal[0].id === "layout") {
                    value = ast.equal[1].value;
                }
            }
        });
        return value || defaultVal;
    }
    
    Layout.getLayoutVal = getLayoutVal
};
