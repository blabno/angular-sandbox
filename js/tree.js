var itc = angular.module("ITC", ["ui.bootstrap", "ngResource"]);
var NODE_TYPE_PACKAGE = "package";
var NODE_TYPE_USECASE = "usecase";
itc.factory("Panes", function (PackageDAO, TestDAO, UsecaseDAO, ApplicationEventBus)
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
        openTest: function (testId)
        {
            var i;
            for (i = 0; i < panes.length; i++) {
                panes[i].active = false;
            }
            for (i = 0; i < panes.length; i++) {
                if (panes[i].type == "test" && panes[i].testId == testId) {
                    panes[i].active = true;
                    return;
                }
            }
            var pane = {testId: testId, title: "Loading test #" + testId, type: "test", icon: "icon-cog", active: true, ready: false};
            panes.push(pane);
            var test = TestDAO.getTest(testId, function (test)
            {
                pane.title = test.name;
                pane.data = test;
                pane.ready = true;
            });
        },
        openUsecase: function (usecaseId)
        {
            var i;
            for (i = 0; i < panes.length; i++) {
                panes[i].active = false;
            }
            for (i = 0; i < panes.length; i++) {
                if (panes[i].type == "usecase" && panes[i].usecaseId == usecaseId) {
                    panes[i].active = true;
                    return;
                }
            }
            var pane = {usecaseId: usecaseId, title: "Loading usecase #" + usecaseId, type: "usecase", icon: "icon-eye-open", active: true, ready: false};
            panes.push(pane);
            var usecase = UsecaseDAO.getUsecase(usecaseId, function (usecase)
            {
                pane.title = usecase.name;
                pane.data = usecase;
                pane.ready = true;
            });
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
        USECASE_MODIFIED: "UsecaseModified",
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
                console.debug("broadcasting event: " + event.type + " to " + thisEventListeners.length + " listeners");
                for (var i = 0; i < thisEventListeners.length; i++) {
                    thisEventListeners[i](event);
                }
            } else {
                console.debug("broadcasting event: " + event.type + " to 0 listeners");
            }
        }
    };
});
itc.factory("PackageDAO", function ($resource)
{
    var PackageREST = $resource("/api/package/:id/:controller", {id: "@id"},
            {'query': {method: 'GET', isArray: true}, 'contents': {method: 'GET', isArray: true, params: {controller: "contents"}}});
    return {
        list: function (parentId, callback)
        {
            if (undefined == parentId) {
                PackageREST.query(callback);
            } else {
                PackageREST.contents({id: parentId}, callback);
            }

        },
        persistPackage: function (pkg, callback)
        {
            var restPkg = new PackageREST(pkg);
            restPkg.$save(function (result)
            {
                angular.extend(pkg, result);
                if (callback instanceof Function) {
                    callback(pkg);
                }
            });
        },
        getPackage: function (packageId, success, error)
        {
            PackageREST.get({id: packageId}, success, error);
        },
        removePackage: function (packageId, callback)
        {
            var restPkg = new PackageREST({id: packageId});
            restPkg.$delete(function ()
            {
                if (callback instanceof Function) {
                    callback(packageId);
                }
            });
        }
    }
});
itc.factory("TestDAO", function ($resource)
{
    var TestREST = $resource("/api/test/:id", {id: "@id"});
    return {
        persistTest: function (test, callback)
        {
            var restTest = new TestREST(test);
            restTest.$save(function (result)
            {
                angular.extend(test, result);
                if (callback instanceof Function) {
                    callback(test);
                }
            });
        },
        getTest: function (usecaseId, success, error)
        {
            TestREST.get({id: usecaseId}, success, error);
        },
        removeTest: function (usecaseId, callback)
        {
            var restTest = new TestREST({id: usecaseId});
            restTest.$delete(function ()
            {
                if (callback instanceof Function) {
                    callback(usecaseId);
                }
            });
        }
    }
});
itc.factory("UsecaseDAO", function ($resource)
{
    var UsecaseREST = $resource("/api/usecase/:id", {id: "@id"});
    return {
        persistUsecase: function (usecase, callback)
        {
            var restUsecase = new UsecaseREST(usecase);
            restUsecase.$save(function (result)
            {
                angular.extend(usecase, result);
                if (callback instanceof Function) {
                    callback(usecase);
                }
            });
        },
        getUsecase: function (usecaseId, success, error)
        {
            UsecaseREST.get({id: usecaseId}, success, error);
        },
        removeUsecase: function (usecaseId, callback)
        {
            var restUsecase = new UsecaseREST({id: usecaseId});
            restUsecase.$delete(function ()
            {
                if (callback instanceof Function) {
                    callback(usecaseId);
                }
            });
        }
    }
});
itc.factory("nodeFactory", function (PackageDAO, UsecaseDAO, ApplicationEventBus)
{
    var create = function (pkg)
    {
        if (NODE_TYPE_PACKAGE != pkg.type && NODE_TYPE_USECASE != pkg.type) {
            throw new Error("Illegal type: " + pkg.type);
        }
        function initChildren(node)
        {
            var open = node.open;
            if (undefined == node.children && !node.loadingChildren) {
                node.loadingChildren = true;
                /**
                 * We need to immediately initialise this collection, because scope may observe it several times before XHR request finishes with data.
                 */
                node.children = [];
                console.debug("Lazy loading children of " + node.id);
                PackageDAO.list(node.id, function (children)
                {
                    node.children = [];
                    for (var i = 0; i < children.length; i++) {
                        var child = create(children[i]);
                        node.children.push(child);
                    }
                    node.hasChildren = node.children.length > 0;
                    node.open = open && node.hasChildren;
                    node.loadingChildren = false;
                });
            }
        }

        var destroyChildren = function (node)
        {
            if (undefined != node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    node.children[i].__destroy();
                }
            }
        };

        var packageChildrenModifiedHandler = function (event)
        {
            if (ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED == event.type && event.id == node.id && event.source != node) {
                destroyChildren(node);
                delete node.children;
                initChildren(node);
            }
        };

        var usecaseModifiedHandler = function (event)
        {
            if (ApplicationEventBus.USECASE_MODIFIED == event.type && event.id == node.id && event.source != node) {
                node.name = event.usecase.name;
            }
        };

        var node = {
            type: pkg.type, id: pkg.id, parentId: pkg.parentId, name: pkg.name, getChildren: function ()
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
                ApplicationEventBus.broadcast({source: this, type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: this.id});
            },
            isChildrenInitialized: function ()
            {
                return undefined != this.children;
            },
            removeChild: function (child)
            {
                child.__destroy();
                initChildren(this);
                var index = this.children.indexOf(child);
                if (index > -1) {
                    this.children.splice(index, 1);
                }
                if (NODE_TYPE_USECASE == child.type) {
                    UsecaseDAO.removeUsecase(child.id, function (usecaseId)
                    {
                        ApplicationEventBus.broadcast({source: node, type: ApplicationEventBus.USECASE_REMOVED, id: usecaseId});
                        ApplicationEventBus.broadcast({source: node, type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: node.id});

                    });
                } else {
                    PackageDAO.removePackage(child.id, function (packageId)
                    {
                        ApplicationEventBus.broadcast({source: node, type: ApplicationEventBus.PACKAGE_REMOVED, id: packageId});
                    });
                }
            },
            refresh: function ()
            {
                if (NODE_TYPE_USECASE == this.type) {
                    UsecaseDAO.getUsecase(this.id, function (result)
                    {
                        angular.extend(node, result);
                    }, function (response)
                    {
                        if (404 == response.status) {
                            ApplicationEventBus.broadcast({source: node, type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: node.parentId});
                            alert("Usecase " + node.id + " has been removed");
                        } else {
                            var stringifiedResponse;
                            try {
                                stringifiedResponse = JSON.stringify(response);
                            } catch (e) {
                                stringifiedResponse = response.data;
                            }
                            throw new Error("Cannot get package #" + node.id + ". XHR response (" + response.status + "):" + stringifiedResponse);
                        }
                    });
                } else if (NODE_TYPE_PACKAGE == this.type) {
                    PackageDAO.getPackage(this.id, function (result)
                    {
                        destroyChildren(node);
                        delete node.children;
                        angular.extend(node, result);
                        initChildren(node);
                    }, function (response)
                    {
                        if (404 == response.status) {
                            ApplicationEventBus.broadcast({source: node, type: ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, id: node.parentId});
                            alert("Package " + node.id + " has been removed");
                        } else {
                            var stringifiedResponse;
                            try {
                                stringifiedResponse = JSON.stringify(response);
                            } catch (e) {
                                stringifiedResponse = response.data;
                            }
                            throw new Error("Cannot get package #" + node.id + ". XHR response (" + response.status + "):" + stringifiedResponse);
                        }
                    });
                } else {
                    throw new Error("Refresh: Unsupported node type: " + this.type);
                }
            },
            __destroy: function ()
            {
                ApplicationEventBus.unsubscribe(packageChildrenModifiedHandler);
                ApplicationEventBus.unsubscribe(usecaseModifiedHandler);
                if (undefined != this.children) {
                    for (var i = 0; i < this.children.length; i++) {
                        this.children[i].__destroy();
                    }
                }
            }
        };
        if (NODE_TYPE_PACKAGE == pkg.type) {
            ApplicationEventBus.subscribe(ApplicationEventBus.PACKAGE_CHILDREN_MODIFIED, packageChildrenModifiedHandler);
        } else if (NODE_TYPE_USECASE == pkg.type) {
            ApplicationEventBus.subscribe(ApplicationEventBus.USECASE_MODIFIED, usecaseModifiedHandler);
        }
        return  node;
    };
    return {
        create: create
    }
});

itc.controller("TestCtrl", function ($scope, TestDAO)
{
    //noinspection JSPotentiallyInvalidConstructorUsage
    var markdownConverver = new Showdown.converter();

    var originalTest , editMode;
    $scope.$watch("pane.data", function (value)
    {
        if (originalTest == null && value != null) {
            originalTest = angular.extend({}, value);
        }
        $scope.test = value;
    });

    $scope.isModified = function ()
    {
        return originalTest != null && this.test != null && (originalTest.summary != this.test.summary || originalTest.name != this.test.name);
    };
    $scope.isEditMode = function ()
    {
        return editMode
    };

    $scope.edit = function ()
    {
        editMode = true;
    };
    $scope.exitEdit = function ()
    {
        if (this.isModified()) {
            if (!confirm("There are changes. Do you want to quit without saving?")) {
                return false;
            }
            TestDAO.getTest(this.test.id, function (test)
            {
                angular.extend(originalTest, test);
                angular.extend($scope.test, test);
            });
        }
        editMode = false;
        return true;
    };

    $scope.getSummaryPreview = function ()
    {
        return this.test ? markdownConverver.makeHtml(this.test.summary || "") : "Loading...";
    };

    $scope.close = function ()
    {
        if (!this.exitEdit()) {
            return;
        }
        this.closePane(this.pane);
    };

    $scope.linkUsecase = function ()
    {
        alert("Not implemented yet");
    };

    $scope.save = function ()
    {
        TestDAO.persistTest(this.test, function (result)
        {
            originalTest = angular.extend({}, result);
            $scope.test = angular.extend({}, result);
        });
    };

});
itc.controller("UsecaseCtrl", function ($scope, TestDAO, UsecaseDAO, ApplicationEventBus)
{
    //noinspection JSPotentiallyInvalidConstructorUsage
    var markdownConverver = new Showdown.converter();

    var originalUsecase , editMode;
    $scope.$watch("pane.data", function (value)
    {
        if (originalUsecase == null && value != null) {
            originalUsecase = angular.extend({}, value);
        }
        $scope.usecase = value;
    });

    $scope.isModified = function ()
    {
        return originalUsecase != null && this.usecase != null && (originalUsecase.summary != this.usecase.summary || originalUsecase.name
                != this.usecase.name);
    };
    $scope.isEditMode = function ()
    {
        return editMode
    };

    $scope.edit = function ()
    {
        editMode = true;
    };
    $scope.exitEdit = function ()
    {
        if (this.isModified()) {
            if (!confirm("There are changes. Do you want to quit without saving?")) {
                return false;
            }
            UsecaseDAO.getUsecase(this.usecase.id, function (usecase)
            {
                angular.extend(originalUsecase, usecase);
                angular.extend($scope.usecase, usecase);
            });
        }
        editMode = false;
        return true;
    };

    $scope.getSummaryPreview = function ()
    {
        return this.usecase ? markdownConverver.makeHtml(this.usecase.summary || "") : "Loading...";
    };

    $scope.close = function ()
    {
        if (!this.exitEdit()) {
            return;
        }
        this.closePane(this.pane);
    };

    $scope.newTest = function ()
    {
        var name = prompt("Test name");
        if (null != name && name.trim().length > 0) {
            var test = {name: name, usecases: [this.usecase.id]};
            TestDAO.persistTest(test, function (test)
            {
                $scope.openTest(test);
            });
        }
    };

    $scope.save = function ()
    {
        UsecaseDAO.persistUsecase(this.usecase, function (result)
        {
            originalUsecase = angular.extend({}, result);
            $scope.usecase = angular.extend({}, result);
            ApplicationEventBus.broadcast({type: ApplicationEventBus.USECASE_MODIFIED, id: originalUsecase.id, usecase: originalUsecase});

        });
    };

});
itc.controller("TreeCtrl", function ($scope, PackageDAO, UsecaseDAO, ApplicationEventBus, nodeFactory)
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
            var pkg = {name: name, hasChildren: false, parentId: parentNode.id, type: NODE_TYPE_PACKAGE};
            PackageDAO.persistPackage(pkg, function (pkg)
            {
                if (parentNode.isChildrenInitialized()) {
                    parentNode.addChild(nodeFactory.create(pkg));
                } else {
                    parentNode.open = true;
                    parentNode.hasChildren = true;
                }
            });
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
            var usecase = {name: name, hasChildren: false, parentId: parentNode.id, type: NODE_TYPE_USECASE};
            UsecaseDAO.persistUsecase(usecase, function ()
            {
                if (parentNode.isChildrenInitialized()) {
                    parentNode.addChild(nodeFactory.create(usecase));
                } else {
                    parentNode.open = true;
                    parentNode.hasChildren = true;
                }
            });
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

    $scope.remove = function ()
    {
        var thisNode = getNode();
        getParentNode().removeChild(thisNode);
        if ($scope.selectedNode == thisNode) {
            $scope.select(null);
        }
    };

    $scope.refresh = function ()
    {
        getNode().refresh();
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
        } else if ("test" == pane.type) {
            return "template/pane/test.html";
        } else {
            throw new Error("Invalid pane type: " + pane.type);
        }
    };

    $scope.openTest = function (test)
    {
        Panes.openTest(test.id);
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
            var container = element.parents(".ui-layout-pane");
            function reattach()
            {
                //noinspection JSUnresolvedVariable
                var parent = element.parents(attrs.keepInView);
                if (parent.size() == 0) {
                    return;
                }
                var elementOuterHeight = element.outerHeight();
                if (parent.offset().top + parent.innerHeight() + container.scrollTop() <= container.height()) {
                    element.css({
                        position: 'static',
                        width: '100%'
                    });
                    element.children().css({width: '100%'});
                    parent.css({paddingBottom: 0});
                } else {
                    var bottom = $window.innerHeight() - container.height();
                    element.css({
                        position: 'fixed',
                        bottom: bottom,
                        width: parent.innerWidth()
                    });
                    element.children().css({width: parent.innerWidth()});
                    parent.css({paddingBottom: elementOuterHeight + "px"});
                }
            }

            element.resize(reattach);
            $window.resize(reattach);
            container.resize(reattach);
            scope.$watch(attrs.ngModel, function ()
            {
                reattach();
            });
        }
    }
});

itc.directive("keytips", function ()
{
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attrs)
        {
            var watchExpressions = attrs['keytips'].split(",");
            for (var i = 0; i < watchExpressions.length; i++) {
                var expression = watchExpressions[i];
                scope.$watch(expression, function (value)
                {
                    if (value) {
                        jQuery(element).keyTips();
                    }
                });
            }
        }
    }
});
