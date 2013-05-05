var itc = angular.module("ITC", ["ui.bootstrap"]);

itc.controller("TreeCtrl", function ($scope) {
    $scope.children = [
        {name:"A", children:[]}
    ];
});
itc.controller("NodeCtrl", function ($scope) {

    $scope.open = true;

    $scope.add = function (node) {
        node.children.push({name:new Date(), children:[]});
    };

    $scope.toggle = function (node) {
        if (node.children.length == 0) {
            return;
        }
        $scope.open = !$scope.open;
    };

});
