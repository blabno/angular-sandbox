var itc = angular.module("ITC", ["ui.bootstrap"]);
var NODE_TYPE_PACKAGE = "package";
var NODE_TYPE_USECASE = "usecase";
itc.factory("Panes", function (PackageDAO, ApplicationEventBus)
{
    var panes = [];
    ApplicationEventBus.subscribe(ApplicationEventBus.USECASE_REMOVED, function (event)
    {
        for (var i = 0; i < panes.length; i++) {
            if ("usecase" == panes[i].type && event.id == panes[i].data.id) {
                panes.splice(i, 1);
                break;
            }
        }
    });
    return  {
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
            panes.push({title: usecase.name, type: "usecase", icon: "icon-eye-open", active: true, data: usecase, getSummaryPreview: function ()
            {
                //noinspection JSPotentiallyInvalidConstructorUsage
                var converter = new Showdown.converter();
                return converter.makeHtml(this.data.summary || "");

            }});
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
itc.factory("ApplicationEventBus", function ()
{
    var listeners = {};
    return {
        PACKAGE_CHILDREN_MODIFIED: "PackageChildrenModified",
        USECASE_REMOVED: "UsecaseRemoved",
        PACKAGE_REMOVED: "PackageRemoved",
        getEvents: function ()
        {
            var list = [];
            for (var event in listeners) {
                if (listeners.hasOwnProperty(event)) {
                    list.push(event);
                }

            }
            return list;
        },
        getListenersCount: function (event)
        {
            return listeners[event].length;
        },
        subscribe: function (eventName, listener)
        {
            console.debug("subscribing to event: " + eventName);
            if (undefined == listeners[eventName]) {
                listeners[eventName] = [];
            }
            listeners[eventName].push(listener);
        },
        unsubscribe: function (listener)
        {
            for (var event in listeners) {
                if (!listeners.hasOwnProperty(event)) {
                    continue;
                }
                var index = listeners[event].indexOf(listener);
                if (index > -1) {
                    listeners[event].splice(index, 1);
                    break;
                }
            }
        },
        /**
         * Notifies all listeners about event.
         *
         * This method is just a temporary thing
         *
         * @param event event to publish
         */
        broadcast: function (event)
        {
            var thisEventListeners = listeners[event.type];
            if (undefined != thisEventListeners) {
                console.debug("boradcasting event: " + event.type + " to " + thisEventListeners.length + " listeners");
                for (var i = 0; i < thisEventListeners.length; i++) {
                    thisEventListeners[i](event);
                }
            } else {
                console.debug("boradcasting event: " + event.type + " to 0 listeners");
            }
        }
    };
});
itc.factory("PackageDAO", function (ApplicationEventBus)
{
    /**
     * Mock data
     **/
    var rootNodes = [

    ];
    var nodes = [
        {}
    ];
    var nodeChildMap = [];
    var mockDataInitialized = false;

    function addChild(parentIndex, node)
    {
        var parentNode;
        var parentId;
        if (null != parentIndex) {
            parentNode = nodes[parentIndex];
            parentId = parentNode.id;
        }
        node.parentId = parentId;
        nodes.push(node);
        if (null != parentIndex) {
            var children = nodeChildMap[parentId];
            if (undefined == children) {
                nodeChildMap[parentId] = children = [];
            }
            children.push(node);
            parentNode.hasChildren = true;
        } else {
            rootNodes.push(node)
        }
        if (mockDataInitialized) {
            ApplicationEventBus.broadcast({type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: parentId});
        }
    }

    function removeNodeAndChildren(node)
    {
        if (NODE_TYPE_PACKAGE == node.type && undefined == node.parentId) {
            var index = rootNodes.indexOf(node);
            rootNodes.splice(index, 1);
        }
        if (mockDataInitialized && undefined != nodes[node.id]) {
            if ("usecase" == node.type) {
                ApplicationEventBus.broadcast({type: ApplicationEventBus.USECASE_REMOVED, id: node.id});
            } else if ("package" == node.type) {
                ApplicationEventBus.broadcast({type: ApplicationEventBus.PACKAGE_REMOVED, id: node.id});
            }
        }
        delete nodes[node.id];
        var children = nodeChildMap[node.id];
        if (undefined != children) {
            for (var i = 0; i < children.length; i++) {
                removeNodeAndChildren(children[i]);
            }
        }
    }

    function removeNode(node)
    {
        removeNodeAndChildren(node);
        var siblings = nodeChildMap[node.parentId];
        if (undefined != siblings) {
            var index = siblings.indexOf(node);
            siblings.splice(index, 1);
            if (0 == siblings.length) {
                delete nodeChildMap[node.parentId];
                var parentNode = nodes[node.parentId];
                if (undefined != parentNode) {
                    parentNode.hasChildren = false;
                }
            }
        }
        if (mockDataInitialized) {
            if (NODE_TYPE_USECASE == node.type) {
                ApplicationEventBus.broadcast({type: ApplicationEventBus.USECASE_REMOVED, id: node.id});
            } else if (NODE_TYPE_PACKAGE == node.type) {
                ApplicationEventBus.broadcast({type: ApplicationEventBus.PACKAGE_REMOVED, id: node.id});
            }
            ApplicationEventBus.broadcast({type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: node.parentId});
        }
    }

    addChild(null, {id: 1, name: "Requester", hasChildren: true});
    addChild(null, {id: 2, name: "Supplier", hasChildren: false});
    addChild(null, {id: 3, name: "Admin", hasChildren: false});

    var node;
    for (var i = 4; i < 100; i++) {
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
    mockDataInitialized = true;
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
        persistPackage: function (pkg)
        {
            pkg.id = nodes.length;
            addChild(pkg.parentId, pkg);
        },
        removePackage: function (packageId)
        {
            var node = nodes[packageId];
            if (undefined != node) {
                removeNode(node);
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
        },
        removeUsecase: function (usecaseId)
        {
            var node = nodes[usecaseId];
            if (undefined != node) {
                removeNode(node);
            }
        }
    }
});
itc.factory("nodeFactory", function (PackageDAO, ApplicationEventBus)
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

        var packageChildrenModifiedHandler = function (event)
        {
            if (ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED == event.type && event.id == node.id) {
                delete node.children;
                initChildren(node);
                node.hasChildren = node.children.length > 0;
                node.open = node.open && node.hasChildren;
            }
        };

        var node = {
            type: pkg.type, id: pkg.id, name: pkg.name, getChildren: function ()
            {
                if (!this.open && undefined != this.id) {
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
                child.__destroy();
                if (NODE_TYPE_USECASE == child.type) {
                    PackageDAO.removeUsecase(child.id);
                } else {
                    PackageDAO.removePackage(child.id);
                }
                initChildren(this);
                this.hasChildren = this.children.length > 0;
                this.open = this.open && this.hasChildren;
            },
            __destroy: function ()
            {
                ApplicationEventBus.unsubscribe(packageChildrenModifiedHandler);
                if (undefined != this.children) {
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].__destroy();
                    }
                }
            }
        };
        ApplicationEventBus.subscribe(ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, packageChildrenModifiedHandler);
        return  node;
    };
    return {
        create: create
    }
});

itc.controller("TreeCtrl", function ($scope, PackageDAO, ApplicationEventBus, nodeFactory)
{
    $scope.child = nodeFactory.create({id: null, name: "Root", hasChildren: true, type: NODE_TYPE_PACKAGE});
    $scope.child.open = true;

    $scope.selectedNode = null;
    $scope.select = function (node)
    {
        if ($scope.selectedNode == node) {
            $scope.selectedNode = null;
        } else {
            $scope.selectedNode = node;
        }
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

    $scope.newPackage = function ()
    {
        var name = prompt("Package name");
        if (null != name && name.trim().length > 0) {
            var parentNode = (null == $scope.selectedNode) ? $scope.child : $scope.selectedNode;
            PackageDAO.persistPackage({name: name, hasChildren: false, parentId: parentNode.id, type: NODE_TYPE_PACKAGE});
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
            PackageDAO.persistUsecase({name: name, hasChildren: false, parentId: parentNode.id, type: NODE_TYPE_USECASE});
        }
    };

    var nodeRemovedHandler = function (event)
    {
        var node = $scope.selectedNode;
        if (undefined != node && node.id == event.id) {
            if (ApplicationEventBus.PACKAGE_REMOVED == event.type && NODE_TYPE_PACKAGE == node.type) {
                $scope.selectedNode = null;
            } else if (ApplicationEventBus.USECASE_REMOVED == event.type && NODE_TYPE_USECASE == node.type) {
                $scope.selectedNode = null;
            }
        }
    };
    ApplicationEventBus.subscribe(ApplicationEventBus.PACKAGE_REMOVED, nodeRemovedHandler);
    ApplicationEventBus.subscribe(ApplicationEventBus.USECASE_REMOVED, nodeRemovedHandler);

    $scope.getEvents = function ()
    {

        return ApplicationEventBus.getEvents();
    };

    $scope.getListenersCount = function (event)
    {
        return ApplicationEventBus.getListenersCount(event);
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

    $scope.closePane = function (pane)
    {
        Panes.close(pane);
    }
});

itc.directive("keepInView", function ()
{
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs)
        {
            var $window = jQuery(window);

            function reattach()
            {
                //noinspection JSUnresolvedVariable
                var parent = element.parents(attrs.keepInView);
                var elementOuterHeight = element.outerHeight();
                if (parent.offset().top + parent.innerHeight() + $window.scrollTop() <= $window.innerHeight()) {
                    element.css({
                        position: 'static',
                        width: '100%'
                    });
                    parent.css({paddingBottom: 0});
                } else {
                    element.css({
                        position: 'fixed',
                        bottom: 0,
                        width: parent.innerWidth()
                    });
                    parent.css({paddingBottom: elementOuterHeight + "px"});
                }
            }

            element.resize(reattach);
            $window.resize(reattach);
            scope.$watch(attrs.ngModel, function ()
            {
                reattach();
            });
        }
    }
});