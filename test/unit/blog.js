describe("Blog", function () {

    var $httpBackend;

    beforeEach(module("BlogApp"));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        // backend definition common for all tests
        $httpBackend.whenJSONP("http://blog.itcrowd.pl/feeds/posts/default?alt=json-in-script&callback=JSON_CALLBACK&max-results=3")
            .respond({feed:{entry:[
                {title:{$t:"Title 1"}, content:{$t:"Content 1"}, link:[
                    ,
                    ,
                    ,
                    ,
                    {href:"http://example.com/1"}
                ], author:[
                    {name:{$t:"Rabbit Todo"}}
                ]},
                {title:{$t:"Title 1"}, content:{$t:"Content 1"}, link:[
                    ,
                    ,
                    ,
                    ,
                    {href:"http://example.com/2"}
                ], author:[
                    {name:{$t:"John Lando"}}
                ]}
            ]}});
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it("Should load posts on init", inject(function ($rootScope, $controller) {
        var $scope = $rootScope.$new();
        $controller("Blog", {$scope:$scope});
        $httpBackend.flush();
        expect($scope.posts).toBeDefined();
        expect($scope.posts.length).toBe(2);
    }));

});