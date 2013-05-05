var itc = angular.module("ITC", ['ui.bootstrap']);

itc.controller("TabPanel", function ($scope, $compile) {
    $scope.tabs = [
        {heading:'Waco', content:angular.element("<div>Waco contentos</div>")}
    ];

    $scope.addTab = function () {
        $scope.tabs.push({heading:new Date(), content:$compile("<tab>Dynamite " + new Date() + "</tab>")($scope)});
    };

    $scope.removeTab = function (tab) {
        var i = $scope.tabs.indexOf(tab);
        $scope.tabs.splice(i, 1);
    }

});

itc.directive("tab", [function () {
    return {
        restrict:'E',
        transclude:true,
        scope:{},
        template:'<div ng-transclude class="tab"></div>',
        replace:true
    };
}]);
itc.directive("eval", [function () {
    return {
        restrict:'E',
        transclude:false,
        scope:{expr:'&'},
        link:function (scope, element) {
            element.replaceWith(scope.expr());
        },
        replace:true
    };
}]);