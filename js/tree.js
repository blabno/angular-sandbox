var itc = angular.module("ITC", ["ui.bootstrap"]);
var NODE_TYPE_PACKAGE = "package";
var NODE_TYPE_USECASE = "usecase";
itc.factory("Panes", function (PackageDAO)
{
    var panes = [
        {title: "Admin", type: "usecase", icon: "icon-eye-open", active: true, data: {id: 3, name: "Admin", summary: "<h2>Directive info</h2><ul><li>This directive creates new scope.</li></ul><h2>Parameters</h2><ul>"
                + "<li>ngInclude|src – {string} – angular expression evaluating to URL. If the source is a string constant, make sure you wrap it in quotes, e.g. src=\"'myPartialTemplate.html'\".</li>"
                + "<li>onload(optional) – {string=} – Expression to evaluate when a new partial is loaded.</li>"
                + "<li>autoscroll(optional) – {string=} – Whether ngInclude should call $anchorScroll to scroll the viewport after the content is loaded.<ul>"
                + "<li>If the attribute is not set, disable scrolling.</li>" + "<li>If the attribute is set without value, enable scrolling.</li>"
                + "<li>Otherwise enable scrolling only if the expression evaluates to truthy value.</li>" + "</ul></li></ul>"}},
        {title: "Requester", type: "usecase", active: false, data: {id: 2, name: "Requester"}}
    ];
    return {
        getOpenPanes: function ()
        {
            return panes;
        },
        openUsecase: function (usecaseId)
        {
            var usecase = PackageDAO.getUsecase(usecaseId);
            var i;
            for (i = 0; i < panes.length; i++) {
                panes[i].active = false;
            }
            for (i = 0; i < panes.length; i++) {
                if (panes[i].type == "usecase" && panes[i].data.id == usecase.id) {
                    panes[i].active = true;
                    return;
                }
            }
            panes.push({title: usecase.name, type: "usecase", icon: "icon-eye-open", active: true, data: usecase});
        },
        close: function (pane)
        {
            var index = panes.indexOf(pane);
            panes.splice(index, 1);
            //Select a new pane if removed pane was selected
            if (pane.active && panes.length > 0) {
                panes[index < panes.length ? index : index - 1].active = true;
            }
        }
    }
});
itc.factory("PackageDAO", function ()
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
        {}
    ];
    var nodeChildMap = [];

    function addChild(parentIndex, node)
    {
        var parentNode;
        var parentId;
        if (null != parentIndex) {
            parentNode = nodes[parentIndex];
            parentId = parentNode.id;
        }
        nodes.push(node);
        if (null != parentIndex) {
            var children = nodeChildMap[parentId];
            if (undefined == children) {
                nodeChildMap[parentId] = children = [];
            }
            children.push(node);
            parentNode.hasChildren = true;
        }
    }

    addChild(null, rootNodes[0]);
    addChild(null, rootNodes[1]);
    addChild(null, rootNodes[2]);

    var node;
    for (var i = 5; i < 100; i++) {
        node = {id: i, name: "Node " + i, hasChildren: false};
        var parentIndex = Math.max(2, Math.floor(Math.random() * (nodes.length - 2)));
        /**We don't add children to Requester*/
        addChild(parentIndex, node);
    }
    addChild(1, {id: i - 1, name: "Questionnaire"});
    addChild(1, {id: i, name: "Company"});
    addChild(1, {id: i + 1, name: "Rating"});
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
        },
        persistUsecase: function (usecase)
        {
            usecase.id = nodes.length;
            addChild(usecase.parentId, usecase);
        },
        getUsecase: function (usecaseId)
        {
            return nodes[usecaseId];
        }
    }
});
itc.factory("nodeFactory", function (PackageDAO)
{
    var create = function (pkg)
    {
        if (NODE_TYPE_PACKAGE != pkg.type && NODE_TYPE_USECASE != pkg.type) {
            throw new Error("Illegal type: " + pkg.type);
        }
        function initChildren(node)
        {
            if (undefined == node.children) {
                var children = PackageDAO.list(node.id);

                node.children = [];
                for (var i = 0; i < children.length; i++) {
                    var child = create(children[i]);
                    node.children.push(child);
                }
            }
        }

        return {
            type: pkg.type, id: pkg.id, name: pkg.name, getChildren: function ()
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

itc.controller("TreeCtrl", function ($scope, PackageDAO, nodeFactory)
{
    $scope.child = nodeFactory.create({id: null, name: "Root", hasChildren: true, type: NODE_TYPE_PACKAGE});
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
            parentNode.addChild(nodeFactory.create({id: new Date().getTime(), name: name, hasChildren: false, type: NODE_TYPE_PACKAGE}));
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
            var usecase = {id: new Date().getTime(), name: name, hasChildren: false, parentId: parentNode.id, type: NODE_TYPE_USECASE};
            PackageDAO.persistUsecase(usecase);
            parentNode.addChild(nodeFactory.create(usecase));
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
        if (this.isUseCase(getNode())) {
            $scope.openUsecase(getNode());
        }
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

itc.controller("WorkspaceCtrl", function ($scope, Panes)
{
    $scope.panes = Panes.getOpenPanes();

    $scope.src = function (pane)
    {
        if ("usecase" == pane.type) {
            return "template/pane/usecase.html";
        } else {
            throw new Error("Invalid pane type: " + pane.type);
        }
    };

    $scope.openUsecase = function (usecase)
    {
        Panes.openUsecase(usecase.id);
    };
});