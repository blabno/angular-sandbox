var itc = angular.module("ITC", ["ui.bootstrap"]);

itc.controller("TreeCtrl", function ($scope) {
    $scope.children = [
        {name:"A", children:[]}
    ];
    $scope.selectedNode = $scope.children[0];
    $scope.select = function (node) {
        console.log(node)
        $scope.selectedNode = node;
    }

});
itc.controller("NodeCtrl", function ($scope) {

    $scope.open = true;

    $scope.add = function (node) {
        node.children.push({name:new Date(), children:[]});
    };

    $scope.alert = function (node) {
        console.log("alert:" + node);
        $scope.select({childa:node});
    }

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
        scope:{value:'&', select:'&'},
        templateUrl:'template/treeNode.html',
        link:function (scope, elm, attrs, ngBindHtml) {
            var childTemplate = '<treenode ng-repeat="child in value().children" value="child" select="select(childa)"/>';
            var children = $compile(childTemplate)(scope);
            elm.find("ul").append(children);
        },
        replace:false
    }
});