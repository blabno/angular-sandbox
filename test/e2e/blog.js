describe("Blog", function () {

    it("Should load posts on init", function () {
        browser().navigateTo("index.html");
        expect(repeater('ul li').count()).toEqual(3);
        expect(repeater('ul li').row(1)).toEqual(["Bernard Łabno","Graphene hangs when page fragment not found"] );
        expect(element("ul li:first-child a").attr("href")).toEqual("http://blog.itcrowd.pl/2013/04/css3-how-to-make-it-work-in-internet.html")
    });

});