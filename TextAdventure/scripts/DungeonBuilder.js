/**
 * Namespace for DungeonBuilder.html
 */
registerNamespace("Pages.DungeonBuilder", function (ns)
{
	ns.newDungeon = () =>
	{

	};

	ns.loadDungeon = () =>
	{

	};

	ns.saveDungeon = () =>
	{

	};

	ns.newArea = () =>
	{

	};

	ns.newItem = () =>
	{

	};

	ns.newEvent = () =>
	{

	};

	ns.newNPC = () =>
	{

	};

	ns.newCriteria = () =>
	{

	};

	ns.sectionHeightUpdateOnResize = () =>
	{
		const metadataHeight = Common.DOMLib.getAbsoluteHeight(document.getElementById("metaForm"));
		if (ns.lastMetadataHeight === metadataHeight) { return; }
		ns.lastMetadataHeight = metadataHeight;

		const dataHeadingHeight = ns.dataHeadingHeight
			|| Common.DOMLib.getAbsoluteHeight(document.getElementById("dataHeader"));
		ns.dataHeadingHeight = dataHeadingHeight;

		const headingBuffers = 50;
		const magicBuffer = 15;

		const dataPGC = document.getElementById("dataCtrl_pgc");
		const dataSectionContentStyles = window.getComputedStyle(document.getElementById("dataSectionContent"));
		const dataSectionContentPadding = parseFloat(dataSectionContentStyles['paddingTop'])
			+ parseFloat(dataSectionContentStyles['paddingBottom']);
		const dataPGCOffset = metadataHeight
			+ dataHeadingHeight
			+ dataSectionContentPadding
			+ headingBuffers
			+ magicBuffer;
		dataPGC.style.maxHeight = `calc(100vh - ${dataPGCOffset}px)`;

		const pinList = document.getElementById("pinList");
		const pinsSectionContentStyles = window.getComputedStyle(document.getElementById("pinsSectionContent"));
		const pinsSectionContentPadding = parseFloat(pinsSectionContentStyles['paddingTop'])
			+ parseFloat(pinsSectionContentStyles['paddingBottom']);
		const pinsListOffset = metadataHeight
			+ dataHeadingHeight
			+ pinsSectionContentPadding
			+ headingBuffers
			+ magicBuffer;
		pinList.style.maxHeight = `calc(100vh - ${pinsListOffset}px)`;
	};
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	Common.loadTheme();
	Common.setUpAccessibility();
	Common.Components.registerShortcuts({
		"ALT+H": {
			action: () => { document.getElementById("homeLink").click(); },
			description: "Return to the home page"
		},
		"ALT+S": {
			action: () => { document.getElementById("shortcutsButton").click(); },
			description: "Show shortcut keys"
		},
	});

	Pages.DungeonBuilder.dataControl = new Common.Controls.PageControl.PageControl(
		document.getElementById("dataCtrl"),
		document.getElementById("dataCtrl_ts"),
		document.getElementById("dataCtrl_pgc"),
		{
			"dataCtrl_tab_Areas": document.getElementById("dataCtrl_page_Areas"),
			"dataCtrl_tab_Items": document.getElementById("dataCtrl_page_Items"),
			"dataCtrl_tab_Events": document.getElementById("dataCtrl_page_Events"),
			"dataCtrl_tab_NPCs": document.getElementById("dataCtrl_page_NPCs"),
			"dataCtrl_tab_Criteria": document.getElementById("dataCtrl_page_Criteria"),
			"dataCtrl_tab_Character": document.getElementById("dataCtrl_page_Character"),
		},
		"No Tab Selected",
		"Data"
	);

	const resizeObserver = new ResizeObserver(Pages.DungeonBuilder.sectionHeightUpdateOnResize);
	resizeObserver.observe(document.getElementById("metaForm"));
	Pages.DungeonBuilder.sectionHeightUpdateOnResize();
};