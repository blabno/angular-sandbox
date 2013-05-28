var itc = angular.module("ITC", ["ui.bootstrap"]);

itc.factory("packageDAO", function ()
{
    /**
     * Mock data
     **/
    var rootChildren = [
        {id: 1, name: "Requester", hasChildren: true},
        {id: 2, name: "Supplier", hasChildren: false}
    ];
    var requesterChildren = [
        {id: 3, name: "Questionnaire", hasChildren: false}
    ];
    var nodes = [requesterChildren[0]];
    var nodeChildMap = [];
    for (var i = 4; i < 20; i++) {
        var node = {id: i, name: "Node " + i, hasChildren: false};
        var parentIndex = Math.floor(Math.random() * (nodes.length - 1));
        var parentNode = nodes[parentIndex];
        var parentId = parentNode.id;
        nodes.push(node);
        requesterChildren.push();
        var children = nodeChildMap[parentId];
        if (undefined == children) {
            nodeChildMap[parentId] = children = [];
        }
        children.push(node);
        parentNode.hasChildren = true;
    }
    /**
     * End of mock data
     */
    return {
        list: function (parentId)
        {
            console.debug("Lazy loading children of " + parentId);
            if (1 == parentId) {
                return requesterChildren;
            } else if (undefined == parentId) {
                return  rootChildren;
            } else {
                if (undefined == nodeChildMap[parentId]) {
                    return [];
                } else {
                    return nodeChildMap[parentId];
                }
            }
        }
    }
});
itc.factory("nodeFactory", function (packageDAO)
{
    var create = function (pkg)
    {
        function initChildren(node)
        {
            if (undefined == node.children) {
                var children = packageDAO.list(node.id);

                node.children = [];
                for (var i = 0; i < children.length; i++) {
                    var child = create(children[i]);
                    node.children.push(child);
                }
            }
        }

        return {
            type: "package", id: pkg.id, name: pkg.name, getChildren: function ()
            {
                if (!this.open) {
                    return [];
                }
                initChildren(this);
                return this.children;
            }, hasChildren: pkg.hasChildren, open: false, addChild: function (child)
            {
                initChildren(this);
                this.children.push(child);
                this.open = true;
                this.hasChildren = true;
            }
        };
    };
    return {
        create: create
    }
});

itc.controller("TreeCtrl", function ($scope, packageDAO, nodeFactory)
{
    var rootNode = nodeFactory.create({id: null, name: "Root"});
    rootNode.open = true;
    $scope.getChildren = function ()
    {
        return rootNode.getChildren();
    };

    $scope.selectedNode = rootNode.getChildren()[0];
    $scope.select = function (node)
    {
        $scope.selectedNode = node;
    }

});
itc.controller("NodeCtrl", function ($scope, nodeFactory)
{
    $scope.isOpen = function (node)
    {
        return node.open;
    };

    $scope.add = function (node)
    {
        node.addChild(nodeFactory.create({id: new Date().getTime(), name: new Date(), hasChildren: false}));
    };

    $scope.toggle = function (node)
    {
        if (!node.hasChildren) {
            return;
        }
        node.open = !node.open;
    };

});

itc.directive("treenode", function ($compile)
{
    return {
        restrict: 'E',
        transclude: false,
        scope: true,
        templateUrl: 'template/treeNode.html',
        link: function (scope, elm)
        {
            var childTemplate = '<treenode ng-repeat="child in child.getChildren()"/>';
            var children = $compile(childTemplate)(scope);
            elm.find("ul").append(children);
        },
        replace: true
    }
});