var itc = angular.module("ITC", ["ui.bootstrap"]);
var NODE_TYPE_PACKAGE = "package";
var NODE_TYPE_USECASE = "usecase";
itc.factory("packageDAO", function ()
{
    /**
     * Mock data
     **/
    var rootNodes = [
        {id:1, name:"Requester", hasChildren:true},
        {id:2, name:"Supplier", hasChildren:false},
        {id:3, name:"Admin", hasChildren:false}
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

    var node;
    for (var i = 5; i < 100; i++) {
        node = {id:i, name:"Node " + i, hasChildren:false};
        var parentIndex = Math.floor(Math.random() * (nodes.length - 1)) + 1;
        /**We don't add children to Requester*/
        addChild(parentIndex, node);
    }
    addChild(0, {id:i + 1, name:"Questionnaire"});
    addChild(0, {id:i + 2, name:"Company"});
    addChild(0, {id:i + 3, name:"Rating"});
    for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        var children = nodeChildMap[node.id];
        if (undefined != children && children.length > 0) {
            node.type = NODE_TYPE_PACKAGE;
        } else {
            node.type = NODE_TYPE_USECASE;
        }
    }
    /**
     * End of mock data
     */
    return {
        list:function (parentId)
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
        if (NODE_TYPE_PACKAGE != pkg.type && NODE_TYPE_USECASE != pkg.type) {
            throw new Error("Illegal type: " + pkg.type);
        }
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
            type:pkg.type, id:pkg.id, name:pkg.name, getChildren:function ()
            {
                if (!this.open) {
                    return [];
                }
                initChildren(this);
                return this.children;
            }, hasChildren:pkg.hasChildren, open:false, addChild:function (child)
            {
                initChildren(this);
                this.children.push(child);
                this.hasChildren = true;
                this.open = true;
            },
            removeChild:function (child)
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
        create:create
    }
});

itc.controller("TreeCtrl", function ($scope, packageDAO, nodeFactory)
{
    $scope.child = nodeFactory.create({id:null, name:"Root", hasChildren:true, type:NODE_TYPE_PACKAGE});
    $scope.child.open = true;

    $scope.selectedNode = null;
    $scope.select = function (node)
    {
        $scope.selectedNode = node;
    };

    $scope.isSelected = function (node)
    {
        return $scope.selectedNode == node;
    };

    $scope.isPackage = function (node)
    {
        return null != node && NODE_TYPE_PACKAGE == node.type;
    };

    $scope.isUseCase = function (node)
    {
        return null != node && NODE_TYPE_USECASE == node.type;
    };

    $scope.remove = function (node)
    {
        return null != node && NODE_TYPE_PACKAGE == node.type;
    };
    $scope.newPackage = function ()
    {
        var name = prompt("Package name");
        if (null != name && name.trim().length > 0) {
            var parentNode = (null == $scope.selectedNode) ? $scope.child : $scope.selectedNode;
            parentNode.addChild(nodeFactory.create({id:new Date().getTime(), name:name, hasChildren:false, type:NODE_TYPE_PACKAGE}));
        }
    };
    $scope.newUsecase = function ()
    {
        if (null == $scope.selectedNode || !$scope.isPackage($scope.selectedNode)) {
            alert("Select package");
            return;
        }
        var name = prompt("Usecase name");
        if (null != name && name.trim().length > 0) {
            var parentNode = (null == $scope.selectedNode) ? $scope.child : $scope.selectedNode;
            parentNode.addChild(nodeFactory.create({id:new Date().getTime(), name:name, hasChildren:false, type:NODE_TYPE_USECASE}));
        }
    };

});
itc.controller("NodeCtrl", function ($scope)
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

    $scope.getChildren = function ()
    {
        return getNode().getChildren();
    };

    $scope.removeMe = function ()
    {
        var thisNode = getNode();
        getParentNode().removeChild(thisNode);
        if ($scope.selectedNode == thisNode) {
            $scope.select(null);
        }
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
        restrict:'E',
        transclude:false,
        scope:false,
        templateUrl:'template/treeNode.html',
        link:function (scope, elm)
        {
            var childTemplate = '<li ng-repeat="child in getChildren()"><treenode></treenode></li>';
            var children = $compile(childTemplate)(scope);
            elm.find("ul").append(children);
        },
        replace:true
    }
});

itc.controller("WorkspaceTabsCtrl", function ($scope)
{
    $scope.panes = [
        {title:"Admin", type:"usecase", icon:"icon-eye-open", active:true, data:{id:3, name:"Admin", summary:"<h2>Directive info</h2><ul><li>This directive creates new scope.</li></ul><h2>Parameters</h2><ul>"
                + "<li>ngInclude|src – {string} – angular expression evaluating to URL. If the source is a string constant, make sure you wrap it in quotes, e.g. src=\"'myPartialTemplate.html'\".</li>"
                + "<li>onload(optional) – {string=} – Expression to evaluate when a new partial is loaded.</li>"
                + "<li>autoscroll(optional) – {string=} – Whether ngInclude should call $anchorScroll to scroll the viewport after the content is loaded.<ul>"
                + "<li>If the attribute is not set, disable scrolling.</li>" + "<li>If the attribute is set without value, enable scrolling.</li>"
                + "<li>Otherwise enable scrolling only if the expression evaluates to truthy value.</li>" + "</ul></li></ul>"}},
        {title:"Requester", type:"usecase", active:false, data:{id:2, name:"Requester"}}
    ];

    $scope.src = function (pane)
    {
        if ("usecase" == pane.type) {
            return "template/pane/usecase.html";
        } else {
            throw new Error("Invalid pane type: " + pane.type);
        }
    }
});