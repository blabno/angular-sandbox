var blogApp = angular.module("BlogApp", []);

blogApp.controller('Blog', function ($scope, $http) {

    $scope.posts = [];

    $http.jsonp("http://blog.itcrowd.pl/feeds/posts/default?alt=json-in-script&callback=JSON_CALLBACK&max-results=3")
        .success(function (data) {
            $scope.posts.length = 0;
            var entries = data.feed.entry;
            for (var i = 0; i < entries.length; i++) {
                $scope.posts.push({title:entries[i].title.$t, content:entries[i].content.$t, link:entries[i].link[4].href, author:entries[i].author[0].name.$t});
            }
        });
});
