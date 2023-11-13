/**
 * Namespace for DungeonBuilder.html
 */
registerNamespace("Pages.DungeonBuilder", function (ns)
{
	ns.newDungeon = () =>
	{
		if (!!ns.Data)
		{
			Common.Controls.Popups.showModal(
				`New Dungeon`,
				`<p>Begin a new dungeon? All unsaved chagnes will be lost.</p><br />`
				+ `<button id="confirmBtn" style="float: right; height: 25px; margin-left: 5px;">`
				+ `Continue</button>`
				+ `<button id="abortBtn" style="float: right; height: 25px;">`
				+ `Go back</button>`
			);
			document.getElementById("confirmBtn").onclick = () =>
			{
				Common.Controls.Popups.hideModal();
				clearAllData();
			};
			document.getElementById("abortBtn").onclick = () =>
			{
				Common.Controls.Popups.hideModal();
			};
		}
		else
		{
			clearAllData();
			fillInBasicData();
		}
	};

	ns.loadDungeon = () =>
	{
		if (!!ns.Data)
		{
			Common.Controls.Popups.showModal(
				`Load Dungeon`,
				`<p>Load a new dungeon? All unsaved chagnes will be lost.</p><br />`
				+ `<button id="confirmBtn" style="float: right; height: 25px; margin-left: 5px;">`
				+ `Continue</button>`
				+ `<button id="abortBtn" style="float: right; height: 25px;">`
				+ `Go back</button>`
			);
			document.getElementById("confirmBtn").onclick = () =>
			{
				Common.Controls.Popups.hideModal();

				clearAllData();
				loadDungeonFromFile();
			};
			document.getElementById("abortBtn").onclick = () =>
			{
				Common.Controls.Popups.hideModal();
			};
		}
		else
		{
			clearAllData();
			loadDungeonFromFile();
		}
	};

	function clearAllData()
	{
		ns.Data = {};

		for (const widgetEl of getAllPinnableWidgets())
		{
			widgetEl.remove();
		}

		for (const inputUIEl of getAllInputUIEls())
		{
			inputUIEl.value = "";
		}

		setSaveTime();
	};

	function loadDungeonFromFile()
	{
		Common.FileLib.getFileFromUserAsObject(
			(object) =>
			{
				ns.Data = object;
				renderDungeonFromData();
			},
			[{ 'application/json': ['.json', '.save'] }]
		);
	};

	function renderDungeonFromData()
	{
		fillInBasicData();

		for (const inputUIEl of getAllInputUIEls())
		{
			if (inputUIEl.hasAttribute("data-saveloc") && inputUIEl.hasAttribute("data-prop"))
			{
				const saveLoc = inputUIEl.getAttribute("data-saveloc");
				var saveAncestors = saveLoc.split(".");

				var ancestor = ns.Data;
				for (var i = 0; i < saveAncestors.length; i++)
				{
					ancestor[saveAncestors[i]] = ancestor[saveAncestors[i]] || {};
					ancestor = ancestor[saveAncestors[i]];
				}
				inputUIEl.value = ancestor[inputUIEl.getAttribute("data-prop")];
			}
		}

		setSaveTime();

		//KJA TODO other pinnable widgets
		renderAreaWidgets();
		renderItemWidgets();
	};

	function fillInBasicData()
	{
		ns.Data.World = ns.Data.World || {};
		ns.Data.World.Areas = ns.Data.World.Areas || {};
		ns.Data.World.Items = ns.Data.World.Items || {};

		ns.Data.Events = ns.Data.Events || {};

		ns.Data.NPCs = ns.Data.NPCs || {};

		ns.Data.Criteria = ns.Data.Criteria || {};

		ns.Data.Character = ns.Data.Character || {};
		ns.Data.Character.Equipment = ns.Data.Character.Equipment || [];
		ns.Data.Character.Party = ns.Data.Character.Party || [];
	};

	function renderAreaWidgets()
	{
		for (var areaId of Object.keys(ns.Data.World.Areas))
		{
			Common.DOMLib.createElement(
				"gw-db-area",
				document.getElementById("areaList"),
				{ logicalId: areaId, homeEl: "areaList", pinEl: "pinList" }
			);
		}
	};

	function renderItemWidgets()
	{
		for (var itemId of Object.keys(ns.Data.World.Items))
		{
			Common.DOMLib.createElement(
				"gw-db-item",
				document.getElementById("itemList"),
				{ logicalId: itemId, homeEl: "itemList", pinEl: "pinList" }
			);
		}
	};

	ns.saveDungeon = () =>
	{
		for (const widgetEl of getAllPinnableWidgets())
		{
			widgetEl.saveData();
		}

		for (const inputUIEl of getAllInputUIEls())
		{
			if (inputUIEl.hasAttribute("data-saveloc") && inputUIEl.hasAttribute("data-prop"))
			{
				const saveLoc = inputUIEl.getAttribute("data-saveloc");
				var saveAncestors = saveLoc.split(".");

				var ancestor = ns.Data;
				for (var i = 0; i < saveAncestors.length; i++)
				{
					ancestor[saveAncestors[i]] = ancestor[saveAncestors[i]] || {};
					ancestor = ancestor[saveAncestors[i]];
				}
				ancestor[inputUIEl.getAttribute("data-prop")] = inputUIEl.value;
			}
		}

		ns.Data.Meta["Last Save"] = new Date();
		Common.FileLib.saveJSONFile(
			ns.Data,
			ns.Data.Meta.Title,
			['.save']
		);

		setSaveTime();
	};

	function setSaveTime()
	{
		const timeEl = document.getElementById("txtDate");

		if (!ns.Data || !ns.Data.Meta || !ns.Data.Meta["Last Save"])
		{
			timeEl.setAttribute("datetime", "");
			timeEl.innerText = "-";
			return;
		}

		const saveDateTime = new Date(ns.Data.Meta["Last Save"]);
		
		timeEl.setAttribute("datetime", saveDateTime.toISOString())
		timeEl.innerText = saveDateTime.toLocaleString(
			undefined,
			{ dateStyle: "short", timeStyle: "short" }
		);
	};

	function getAllPinnableWidgets()
	{
		return [
			...document.getElementsByTagName("gw-db-area"),
			...document.getElementsByTagName("gw-db-item")
		];
	};
	function getAllInputUIEls()
	{
		return [
			...document.getElementsByTagName("input"),
			...document.getElementsByTagName("textarea")
		];
	};

	ns.newArea = () =>
	{
		Common.DOMLib.createElement(
			"gw-db-area",
			document.getElementById("areaList"),
			{ homeEl: "areaList", pinEl: "pinList" }
		);
	};

	ns.newItem = () =>
	{
		Common.DOMLib.createElement(
			"gw-db-item",
			document.getElementById("itemList"),
			{ homeEl: "itemList", pinEl: "pinList" }
		);
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
		"ALT+A": {
			action: () => { document.getElementById("dataCtrl_tab_Areas").click(); },
			description: "Show Area list"
		},
		"ALT+I": {
			action: () => { document.getElementById("dataCtrl_tab_Items").click(); },
			description: "Show Item list"
		},
		"ALT+V": {
			action: () => { document.getElementById("dataCtrl_tab_Events").click(); },
			description: "Show Events list"
		},
		"ALT+N": {
			action: () => { document.getElementById("dataCtrl_tab_NPCs").click(); },
			description: "Show NPC list"
		},
		"ALT+C": {
			action: () => { document.getElementById("dataCtrl_tab_Criteria").click(); },
			description: "Show Criteria list"
		},
		"ALT+R": {
			action: () => { document.getElementById("dataCtrl_tab_Character").click(); },
			description: "Show Character"
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

	Pages.DungeonBuilder.newDungeon();
};