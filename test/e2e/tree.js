describe("Tree", function ()
{

    it("Should have 3 nodes", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(repeater('#treeRoot li').count()).toEqual(3);
        expect(repeater('#treeRoot li').row(0)).toEqual(["Requester"]);
        expect(repeater('#treeRoot li').row(1)).toEqual(["Supplier"]);
        expect(repeater('#treeRoot li').row(2)).toEqual(["Admin"]);
    });

    it("Should toggle node 1 on click", function ()
    {
        expect(element('#treeRoot li:nth-of-type(1) ul li').count()).toEqual(0);
        element('#treeRoot li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot li:nth-of-type(1) ul li').count()).toBeGreaterThan(0);
        element('#treeRoot li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot li:nth-of-type(1) ul li').count()).toEqual(0);
    });

    it("Should remove 2 root nodes", function ()
    {
        expect(element('#treeRoot li:nth-of-type(2)').count()).toEqual(1);
        expect(element('#treeRoot li:nth-of-type(3)').count()).toEqual(1);
        element('#treeRoot li:nth-of-type(3) button.btn-danger').click();
        expect(element('#treeRoot li:nth-of-type(3)').count()).toEqual(0);
        element('#treeRoot li:nth-of-type(2) button.btn-danger').click();
        expect(element('#treeRoot li:nth-of-type(2)').count()).toEqual(0);
    });

    it("Should add 1 package to first root node", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#treeRoot > li:nth-of-type(1)').count()).toEqual(1);
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(0);
        element('#treeRoot > li:nth-of-type(1) .toggle').click();
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(3);
        setPromptValue('New package');
        element('#newPackage').click();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(4);
        expect(element('#treeRoot > li:nth-of-type(1) ul li:last-child .name').text()).toEqual("New package");
        expect(element('#treeRoot > li').count()).toEqual(3);
    });

    it("Should add 1 usecase to first root node", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#treeRoot > li:nth-of-type(1)').count()).toEqual(1);
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(0);
        element('#treeRoot > li:nth-of-type(1) .toggle').click();
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(3);
        setPromptValue('New usecase');
        element('#newUsecase').click();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(4);
        expect(element('#treeRoot > li:nth-of-type(1) ul li:last-child .name').text()).toEqual("New usecase");
        expect(element('#treeRoot > li').count()).toEqual(3);
    });

    it("Should not be possible to add usecase without selecting node", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("");
        expect(element('#newUsecase[disabled]').count()).toBe(1);
        setPromptValue('New usecase');
        element('#newUsecase').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
    });

    it("Should not be possible to add package to usecase", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#newPackage[disabled]').count()).toBe(0);
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot  li').count()).toEqual(6);
        element('#treeRoot > li:nth-of-type(1) ul li:last-child .toggle').click();
        expect(element('#newPackage[disabled]').count()).toBe(1);
        setPromptValue('New package');
        element('#newPackage').click();
        expect(element('#treeRoot  li').count()).toEqual(6);
    });

    it("Should not be possible to add usecase to usecase", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#newUsecase[disabled]').count()).toBe(1);
        element('#treeRoot > li:nth-of-type(1) .toggle').click();
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#newUsecase[disabled]').count()).toBe(0);
        expect(element('#treeRoot  li').count()).toEqual(6);
        element('#treeRoot > li:nth-of-type(1) ul li:last-child .toggle').click();
        expect(element('#newUsecase[disabled]').count()).toBe(1);
        setPromptValue('New uscase');
        element('#newUsecase').click();
        expect(element('#treeRoot  li').count()).toEqual(6);
    });

    it("Should remove last child node of first root node", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#treeRoot > li').count()).toEqual(3);
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(3);
        element('#treeRoot > li:nth-of-type(1) > div ul li:last-child button.btn-danger').click();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(2);
        expect(element('#treeRoot > li').count()).toEqual(3);
    });

    it("Should select root and child nodes one by one", function ()
    {
        browser().navigateTo("useCaseTree.html");
        expect(element('#treeRoot > li').count()).toEqual(3);
        element('#treeRoot > li:nth-of-type(1) .toggle').dblclick();
        expect(element('#treeRoot > li:nth-of-type(1) ul li').count()).toEqual(3);
        element('#treeRoot > li:nth-of-type(1) > div ul li:nth-of-type(3) .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Rating");
        element('#treeRoot > li:nth-of-type(1) > div ul li:nth-of-type(2) .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Company");
        element('#treeRoot > li:nth-of-type(1) > div ul li:nth-of-type(1) .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Questionnaire");
        element('#treeRoot > li:nth-of-type(1) > div > .head .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Requester");
        element('#treeRoot > li:nth-of-type(2) > div > .head .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Supplier");
        element('#treeRoot > li:nth-of-type(3) div > .head .toggle').click();
        expect(element('#treeRoot > li').count()).toEqual(3);
        expect(element('#selectedNode').text()).toEqual("Admin");
    });


});