/**
 * Namespace for DungeonBuilder.html
 */
registerNamespace("Pages.DungeonBuilder", function (ns)
{
	ns.newDungeon = () =>
	{
		if (!!ns.Data)
		{
			const doConfirm = () =>
			{
				Common.Controls.Popups.hideModal();
				clearAllData();
				fillInBasicData();
				renderCharacterWidget();
			};
			const doAbort = () =>
			{
				Common.Controls.Popups.hideModal();
			};

			Common.Components.registerShortcuts({
				"ALT+C": {
					action: doConfirm,
					description: "Confirm the dialog"
				},
				"ALT+G": {
					action: doAbort,
					description: "Abort the dialog"
				},
			});
			Common.Controls.Popups.showModal(
				`New Dungeon`,
				`<p>Begin a new dungeon? All unsaved changes will be lost.</p><br />`
				+ `<button id="confirmBtn" style="float: right; height: 25px; margin-left: 5px;">`
				+ `<u>C</u>ontinue</button>`
				+ `<button id="abortBtn" style="float: right; height: 25px;">`
				+ `<u>G</u>o back</button>`,
				undefined,
				() =>
				{
					Common.Components.unregisterShortcuts(["ALT+C", "ALT+G"]);
				}
			);
			document.getElementById("confirmBtn").onclick = doConfirm;
			document.getElementById("abortBtn").onclick = doAbort;
		}
		else
		{
			clearAllData();
			fillInBasicData();
			renderCharacterWidget();
		}
	};

	ns.loadDungeon = () =>
	{
		if (!!ns.Data)
		{
			const doConfirm = () =>
			{
				Common.Controls.Popups.hideModal();

				clearAllData();
				loadDungeonFromFile();
			};
			const doAbort = () =>
			{
				Common.Controls.Popups.hideModal();
			};

			Common.Components.registerShortcuts({
				"ALT+C": {
					action: doConfirm,
					description: "Confirm the dialog"
				},
				"ALT+G": {
					action: doAbort,
					description: "Abort the dialog"
				},
			});
			Common.Controls.Popups.showModal(
				`Load Dungeon`,
				`<p>Load a new dungeon? All unsaved changes will be lost.</p><br />`
				+ `<button id="confirmBtn" style="float: right; height: 25px; margin-left: 5px;">`
				+ `<u>C</u>ontinue</button>`
				+ `<button id="abortBtn" style="float: right; height: 25px;">`
				+ `<u>G</u>o back</button>`,
				undefined,
				() =>
				{
					Common.Components.unregisterShortcuts(["ALT+C", "ALT+G"]);
				}
			);
			document.getElementById("confirmBtn").onclick = doConfirm;
			document.getElementById("abortBtn").onclick = doAbort;
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

		document.getElementById("characterWidget")?.remove();

		for (const inputUIEl of getAllInputUIEls())
		{
			inputUIEl.value = "";
		}

		setSaveTime();
	};

	function loadDungeonFromFile()
	{
		try
		{
			Common.FileLib.getFileFromUserAsObject(
				(object) =>
				{
					ns.Data = object;
					renderDungeonFromData();
				},
				[{ 'application/json': ['.json'] }]
			);
		}
		catch (error)
		{
			window.alert(error);
		}
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

		renderAreaWidgets();
		renderItemWidgets();
		renderEventWidgets();
		renderNPCWidgets();
		renderDialogWidgets();
		renderCriteriaWidgets();
		renderCharacterWidget();
	};

	function fillInBasicData()
	{
		ns.Data.World = ns.Data.World || {};
		ns.Data.World.Areas = ns.Data.World.Areas || {};
		ns.Data.World.Items = ns.Data.World.Items || {};

		ns.Data.Events = ns.Data.Events || {};

		ns.Data.NPCs = ns.Data.NPCs || {};

		ns.Data.Dialogs = ns.Data.Dialogs || {};

		ns.Data.Criteria = ns.Data.Criteria || {};

		ns.Data.Character = ns.Data.Character || {};
		ns.Data.Character.Inventory = ns.Data.Character.Inventory || [];
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

	function renderEventWidgets()
	{
		for (var itemId of Object.keys(ns.Data.Events))
		{
			Common.DOMLib.createElement(
				"gw-db-event",
				document.getElementById("eventList"),
				{ logicalId: itemId, homeEl: "eventList", pinEl: "pinList" }
			);
		}
	};

	function renderNPCWidgets()
	{
		for (var itemId of Object.keys(ns.Data.NPCs))
		{
			Common.DOMLib.createElement(
				"gw-db-npc",
				document.getElementById("npcList"),
				{ logicalId: itemId, homeEl: "npcList", pinEl: "pinList" }
			);
		}
	};

	function renderDialogWidgets()
	{
		for (var itemId of Object.keys(ns.Data.Dialogs))
		{
			Common.DOMLib.createElement(
				"gw-db-dialog",
				document.getElementById("dialogList"),
				{ logicalId: itemId, homeEl: "dialogList", pinEl: "pinList" }
			);
		}
	};

	function renderCriteriaWidgets()
	{
		for (var itemId of Object.keys(ns.Data.Criteria))
		{
			Common.DOMLib.createElement(
				"gw-db-criteria",
				document.getElementById("criteriaList"),
				{ logicalId: itemId, homeEl: "criteriaList", pinEl: "pinList" }
			);
		}
	};

	function renderCharacterWidget()
	{
		Common.DOMLib.createElement(
			"gw-db-character",
			document.getElementById("dataCtrl_page_Character"),
			{ id: "characterWidget" }
		);
	};

	ns.saveDungeon = () =>
	{
		for (const widgetEl of getAllPinnableWidgets())
		{
			if (widgetEl.isOpen)
			{
				widgetEl.saveData();
			}
		}

		document.getElementById("characterWidget").saveData();

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
		try
		{
			ns.Data.Meta["Last Save"] = new Date();
			Common.FileLib.saveJSONFile(
				ns.Data,
				ns.Data.Meta.Title,
				['.json']
			);

			setSaveTime();
		}
		catch (error)
		{
			window.alert(error);
		}
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

		timeEl.setAttribute("datetime", saveDateTime.toISOString());
		timeEl.innerText = saveDateTime.toLocaleString(
			undefined,
			{ dateStyle: "short", timeStyle: "short" }
		);
	};

	function getAllPinnableWidgets()
	{
		return [
			...document.getElementsByTagName("gw-db-area"),
			...document.getElementsByTagName("gw-db-item"),
			...document.getElementsByTagName("gw-db-event"),
			...document.getElementsByTagName("gw-db-npc"),
			...document.getElementsByTagName("gw-db-dialog"),
			...document.getElementsByTagName("gw-db-criteria"),
		];
	};

	function getAllInputUIEls()
	{
		return [
			...document.getElementsByTagName("input"),
			...document.getElementsByTagName("textarea")
		];
	};

	ns.newPinnableWidget = function newPinnableWidget(type)
	{
		switch (type)
		{
			case "gw-db-area":
				return ns.newArea();
			case "gw-db-item":
				return ns.newItem();
			case "gw-db-event":
				return ns.newEvent();
			case "gw-db-npc":
				return ns.newNPC();
			case "gw-db-dialog":
				return ns.newDialog();
			case "gw-db-criteria":
				return ns.newCriteria();
			default:
				return null;
		}
	};

	ns.newArea = () =>
	{
		const areaEl = Common.DOMLib.createElement(
			"gw-db-area",
			document.getElementById("areaList"),
			{ homeEl: "areaList", pinEl: "pinList", open: "" }
		);

		areaEl.logicalIdInEl.focus();
		areaEl.logicalIdInEl.select();
		return areaEl;
	};

	ns.newItem = () =>
	{
		const itemEl = Common.DOMLib.createElement(
			"gw-db-item",
			document.getElementById("itemList"),
			{ homeEl: "itemList", pinEl: "pinList", open: "" }
		);

		itemEl.logicalIdInEl.focus();
		itemEl.logicalIdInEl.select();
		return itemEl;
	};

	ns.newEvent = () =>
	{
		const eventEl = Common.DOMLib.createElement(
			"gw-db-event",
			document.getElementById("eventList"),
			{ homeEl: "eventList", pinEl: "pinList", open: "" }
		);

		eventEl.logicalIdInEl.focus();
		eventEl.logicalIdInEl.select();
		return eventEl;
	};

	ns.newNPC = () =>
	{
		const npcEl = Common.DOMLib.createElement(
			"gw-db-npc",
			document.getElementById("npcList"),
			{ homeEl: "npcList", pinEl: "pinList", open: "" }
		);

		npcEl.logicalIdInEl.focus();
		npcEl.logicalIdInEl.select();
		return npcEl;
	};

	ns.newDialog = () =>
	{
		const dialogEl = Common.DOMLib.createElement(
			"gw-db-dialog",
			document.getElementById("dialogList"),
			{ homeEl: "dialogList", pinEl: "pinList", open: "" }
		);

		dialogEl.logicalIdInEl.focus();
		dialogEl.logicalIdInEl.select();
		return dialogEl;
	};

	ns.newCriteria = () =>
	{
		const criteriaEl = Common.DOMLib.createElement(
			"gw-db-criteria",
			document.getElementById("criteriaList"),
			{ homeEl: "criteriaList", pinEl: "pinList", open: "" }
		);

		criteriaEl.logicalIdInEl.focus();
		criteriaEl.logicalIdInEl.select();
		return criteriaEl;
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

		const dataPGC = document.getElementById("dataCtrl_pgc");
		const dataSectionContentStyles = window.getComputedStyle(document.getElementById("dataSectionContent"));
		const dataSectionContentPadding = parseFloat(dataSectionContentStyles['paddingTop'])
			+ parseFloat(dataSectionContentStyles['paddingBottom']);
		const dataPGCOffset = metadataHeight
			+ dataHeadingHeight
			+ dataSectionContentPadding
			+ headingBuffers
			+ -35 //#dataCtrl_pgc margin-top
			+ 15; //magic buffer :/
		dataPGC.style.maxHeight = `calc(100vh - ${dataPGCOffset}px)`;

		const pinList = document.getElementById("pinList");
		const pinsSectionContentStyles = window.getComputedStyle(document.getElementById("pinsSectionContent"));
		const pinsSectionContentPadding = parseFloat(pinsSectionContentStyles['paddingTop'])
			+ parseFloat(pinsSectionContentStyles['paddingBottom']);
		const pinsListOffset = metadataHeight
			+ dataHeadingHeight
			+ pinsSectionContentPadding
			+ headingBuffers
			+ 15; //magic buffer :/
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
		"ALT+L": {
			action: () => { document.getElementById("dataCtrl_tab_Dialogs").click(); },
			description: "Show Dialogs"
		},
		"ALT+C": {
			action: () => { document.getElementById("dataCtrl_tab_Criteria").click(); },
			description: "Show Criteria list"
		},
		"ALT+R": {
			action: () => { document.getElementById("dataCtrl_tab_Character").click(); },
			description: "Show Character"
		},
		"ALT+T": {
			action: () => { document.getElementById("dataCtrl_tab_Settings").click(); },
			description: "Show Settings"
		},
		"ALT+O": {
			action: () =>
			{
				let element = document.activeElement;
				let path = [];
				let helpText = "";
				let doSkip = false;
				while (element)
				{
					helpText = helpText || element.getAttribute("data-helptext");
					const saveLoc = element.getAttribute("data-saveloc");
					let prop = saveLoc
						? saveLoc + "." + element.getAttribute("data-prop")
						: element.getAttribute("data-prop");
					prop = prop || element.getAttribute("dataProperty") || element.dataPath;
					if (!!prop)
					{
						if (doSkip)
						{
							doSkip = false;
						}
						else
						{
							path.unshift(prop);
						}
					}
					doSkip = doSkip || element.hasAttribute("data-skipParent");
					element = element.parentElement;
				}
				const pathStr = path.join(".");

				if (!pathStr) { return; }

				const boundingRect = document.activeElement.getBoundingClientRect();
				const pathDialog = new Common.Controls.Popups.Dialog(
					"Field Information",
					`${helpText ? helpText + "<br /><br />" : ""}Data address: ${pathStr}`,
					{},
					{},
					document.activeElement
				);
				pathDialog.showAbsolute(boundingRect.left, boundingRect.top);
			},
			description: "Show Field Information"
		},
		"ALT+1": {
			action: () => { document.getElementById("newButton").click(); },
			description: "Start a new save file"
		},
		"ALT+2": {
			action: () => { document.getElementById("loadButton").click(); },
			description: "Load a save file from disk"
		},
		"ALT+3": {
			action: () => { document.getElementById("saveButton").click(); },
			description: "Save to disk"
		},
	});
	Common.SVGLib.insertIcons();

	Pages.DungeonBuilder.dataControl = new Common.Controls.PageControl.PageControl(
		document.getElementById("dataCtrl"),
		document.getElementById("dataCtrl_ts"),
		document.getElementById("dataCtrl_pgc"),
		{
			"dataCtrl_tab_Areas": document.getElementById("dataCtrl_page_Areas"),
			"dataCtrl_tab_Items": document.getElementById("dataCtrl_page_Items"),
			"dataCtrl_tab_Events": document.getElementById("dataCtrl_page_Events"),
			"dataCtrl_tab_NPCs": document.getElementById("dataCtrl_page_NPCs"),
			"dataCtrl_tab_Dialogs": document.getElementById("dataCtrl_page_Dialogs"),
			"dataCtrl_tab_Criteria": document.getElementById("dataCtrl_page_Criteria"),
			"dataCtrl_tab_Character": document.getElementById("dataCtrl_page_Character"),
			"dataCtrl_tab_Settings": document.getElementById("dataCtrl_page_Settings"),
		},
		`<div class="inline-banner"><span id="welcomeInfoTitle">Info</span>`
		+ `<gw-icon iconKey="circle-info" titleId="welcomeInfoTitle"></gw-icon>`
		+ `<span>Use this page to create a JSON save file for a game to play in the <a href="https://textadventure.groundedwren.com/TextAdventure/DungeonnerInterface.html" target="_blank">Dungeoneer Interface</a>!</span>`
		+ `<span>Want to know what something means? Try selecting it and pressing Alt+O</span>`
		+ `</div>`,
		"Data"
	);

	const resizeObserver = new ResizeObserver(Pages.DungeonBuilder.sectionHeightUpdateOnResize);
	resizeObserver.observe(document.getElementById("metaForm"));
	Pages.DungeonBuilder.sectionHeightUpdateOnResize();

	Pages.DungeonBuilder.newDungeon();
};

window.onbeforeunload = (event) =>
{
	event.preventDefault();
	return false;
};
