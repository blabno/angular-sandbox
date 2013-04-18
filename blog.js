function Blog($scope) {

   $scope.posts=[];

    window.loadFeed = function(data) {
        var s = angular.element(document.getElementById("blog")).scope();
        s.$apply(function(){
            s.posts.length=0;
            var entries = data.feed.entry;
            for(var i = 0 ; i < entries.length; i++) {
                s.posts.push({title:entries[i].title.$t, content:entries[i].content.$t, link:entries[i].link[4].href, author:entries[i].author[0].name.$t});
            }
        });
    }
    var script = document.createElement("script");
    script.src="http://blog.itcrowd.pl/feeds/posts/default?alt=json-in-script&callback=loadFeed&max-results=3";
    document.body.appendChild(script)
}
