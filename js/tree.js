var itc = angular.module("ITC", ["ui.bootstrap"]);

itc.factory("packageDAO", function ()
{
    /**
     * Mock data
     **/
    var rootNodes = [
        {id: 1, name: "Requester", hasChildren: true},
        {id: 2, name: "Supplier", hasChildren: false},
        {id: 3, name: "Admin", hasChildren: false}
    ];
    var nodes = [
        rootNodes[0], rootNodes[1], rootNodes[2]
    ];
    var nodeChildMap = [];

    function addChild(parentIndex, node)
    {
        var parentNode = nodes[parentIndex];
        var parentId = parentNode.id;
        nodes.push(node);
        var children = nodeChildMap[parentId];
        if (undefined == children) {
            nodeChildMap[parentId] = children = [];
        }
        children.push(node);
        parentNode.hasChildren = true;
    }

    for (var i = 5; i < 100; i++) {
        var node = {id: i, name: "Node " + i, hasChildren: false};
        var parentIndex = Math.floor(Math.random() * (nodes.length - 1)) + 1;
        /**We don't add children to Requester*/
        addChild(parentIndex, node);
    }
    addChild(0, {id: i + 1, name: "Questionnaire"});
    addChild(0, {id: i + 2, name: "Company"});
    addChild(0, {id: i + 3, name: "Rating"});
    /**
     * End of mock data
     */
    return {
        list: function (parentId)
        {
            console.debug("Lazy loading children of " + parentId);
            if (undefined == parentId) {
                return rootNodes;
            } else if (undefined == nodeChildMap[parentId]) {
                return [];
            } else {
                return nodeChildMap[parentId];
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
                this.hasChildren = true;
                this.open = true;
            },
            removeChild: function (child)
            {
                initChildren(this);
                var index = this.children.indexOf(child);
                this.children.splice(index, 1);
                this.hasChildren = this.children.length > 0;
                this.open = this.open && this.hasChildren;
            }
        };
    };
    return {
        create: create
    }
});

itc.controller("TreeCtrl", function ($scope, packageDAO, nodeFactory)
{
    $scope.child = nodeFactory.create({id: null, name: "Root", hasChildren: true});
    $scope.child.open = true;

    $scope.selectedNode = null;
    $scope.select = function (node)
    {
        $scope.selectedNode = node;
    }

});
itc.controller("NodeCtrl", function ($scope, nodeFactory)
{
    function getNode()
    {
        return $scope.child;
    }

    function getParentNode()
    {
        return $scope.$parent.child;
    }

    $scope.isOpen = function ()
    {
        return getNode().open;
    };

    $scope.add = function ()
    {
        getNode().addChild(nodeFactory.create({id: new Date().getTime(), name: new Date(), hasChildren: false}));
    };

    $scope.getChildren = function ()
    {
        return getNode().getChildren();
    };

    $scope.removeMe = function ()
    {
        getParentNode().removeChild(getNode());
    };

    $scope.toggle = function ()
    {
        var node = getNode();
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
        scope: false,
        templateUrl: 'template/treeNode.html',
        link: function (scope, elm)
        {
            var childTemplate = '<li ng-repeat="child in getChildren()"><treenode></treenode></li>';
            var children = $compile(childTemplate)(scope);
            elm.find("ul").append(children);
        },
        replace: true
    }
});