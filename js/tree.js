var itc = angular.module("ITC", ["ui.bootstrap"]);

itc.controller("TreeCtrl", function ($scope) {
    $scope.children = [
        {name:"A", children:[]}
    ];
    $scope.selectedNode = $scope.children[0];
    $scope.select = function (node) {
        $scope.selectedNode = node;
    }

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

itc.directive("treenode", function ($compile) {
    return {
        restrict:'E',
        transclude:false,
        scope:true,
        templateUrl:'template/treeNode.html',
        link:function (scope, elm, attrs, ngBindHtml) {
            var childTemplate = '<treenode ng-repeat="child in child.children"/>';
            var children = $compile(childTemplate)(scope);
            elm.find("ul").append(children);
        },
        replace:true
    }
});