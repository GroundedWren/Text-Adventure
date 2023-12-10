/**
 * Namespace for DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	//The Meta Page Control
	ns.MetaControl = null;
	ns.InputConsole = null;

	//#region Responsive Layout
	ns.MINI_THRESHOLD = 800;

	ns.showStory = function ()
	{
		document.getElementById("mainContent").classList.remove("meta");
		document.getElementById("consoleInput").focus();
	};

	ns.showMeta = function ()
	{
		document.getElementById("mainContent").classList.add("meta");
	};

	ns.isMiniViewport = false;
	ns.resizeListener = () =>
	{
		ns.isMiniViewport = window.innerWidth <= ns.MINI_THRESHOLD;
	};
	//#endregion

	//#region File I/O
	ns.saveToFile = () =>
	{
		ns.Data.Meta["Last Save"] = new Date();
		Common.FileLib.saveJSONFile(
			ns.Data,
			"New Save",
			['.json']
		);

		applyMetaData();
	};

	ns.__shouldApplySave = false;
	ns.saveUploaded = (filename, saveObj) =>
	{
		Common.Components.registerShortcuts({
			"ALT+Y": {
				action: ns.__uploadSaveModalAccepted,
				description: "Confirm the dialog"
			},
			"ALT+N": {
				action: ns.__uploadSaveModalRejected,
				description: "Abort the dialog"
			},
		});

		const timestamp = new Date(saveObj.Meta["Last Save"]).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
		Common.Controls.Popups.showModal(
			"Import Save",
			`<h2>${filename}</h2>`
			+ `<p>${saveObj.Meta.Description || "No description"}<br />`
			+ `Created by: ${saveObj.Meta.Creator}<br />`
			+ `Timestamp: <time datetime=${saveObj.Meta["Last Save"]}>${timestamp}</time></p>`
			+ `<p>If you continue, any current data will be overwritten. Continue?</p>`
			+ `<button style="float: right; height: 25px; margin-left: 5px;" onclick="Pages.DungeoneerInterface.__uploadSaveModalAccepted()">`
			+ `<u>Y</u>es</button>`
			+ `<button style="float: right; height: 25px;" onclick="Pages.DungeoneerInterface.__uploadSaveModalRejected()">`
			+ `<u>N</u>ever mind</button>`,
			undefined,
			() =>
			{
				Common.Components.unregisterShortcuts(["ALT+Y", "ALT+N"]);

				if (ns.__shouldApplySave)
				{
					ns.Data = saveObj;
					ns.applySaveData();
				}
				ns.__shouldApplySave = false;
			}
		);
	};
	ns.__uploadSaveModalAccepted = () =>
	{
		ns.__shouldApplySave = true;
		Common.Controls.Popups.hideModal();

	};
	ns.__uploadSaveModalRejected = () =>
	{
		ns.__shouldApplySave = false;
		document.getElementById("saveUpload").value = null;
		Common.Controls.Popups.hideModal();
	};

	ns.importFreshSave = (filename, path) =>
	{
		Common.FileLib.loadJSONFileFromDirectory(path).then(saveObj =>
		{
			if (!saveObj) { return; }
			ns.saveUploaded(filename, saveObj);
		});
	};
	//#endregion

	//#region Apply Save Data
	ns.applySaveData = function ()
	{
		applyMetaData();
		applyCharacterData().then(() =>
		{
			document.getElementById("storyContent").innerHTML = "";
			ns.InputConsole.clear();
			ns.InputConsole.removeAllContexts();
			ns.Logic.enterArea(ns.Data.Character.Location || "0");
		});
	};
	function applyMetaData()
	{
		var lastSaveDate = ns.Data.Meta["Last Save"];
		ns.Data.Meta["Last Save"] = lastSaveDate
			? new Date(lastSaveDate).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })
			: "Never";

		document.getElementById("currentGameTableBody").innerHTML = Object.keys(ns.Data.Meta).map(
			key => `<tr><th scope="row" class="no-break">${key}</th><td>${ns.Data.Meta[key]}</td></tr>`
		).join("");

		document.getElementById("currentGameMetaCard").classList.remove("hidden");
	};
	async function applyCharacterData()
	{
		ns.MetaControl.setActiveTab("metaPane_tab_Player");
		document.getElementById("consoleInput").focus();
		if (ns.Data.Character.Name === null) //Assume this means character is not loaded
		{
			ns.showStory();
			await ns.setupCharacter();
		}
		else
		{
			ns.Character.setupFromData();
		}
	};
	//#endregion

	//#region Console Commands
	//#endregion

	ns.prepareTextForDisplay = function prepareTextForDisplay(text)
	{
		let newText = text.replaceAll("\n", "<br />");
		let textAry = newText.split("@");
		for (let i = 1; i < textAry.length; i += 2)
		{
			if (textAry[i].toLowerCase() === "money-label")
			{
				textAry[i] = ns.Data.World.MoneyLabel;
				continue;
			}

			const replParams = textAry[i].split("-");

			let name = "@ERROR-name@";
			let pronouns = {
				Subjective: "@ERROR-subjective@",
				Objective: "@ERROR-objective@",
				Possessive: "@ERROR-possessive@",
				Reflexive: "@ERROR-reflexive@",
				PossessiveAdjective: "@ERROR-possessiveadjective@",
			};
			if (replParams[0] === "Character")
			{
				name = ns.Data.Character.Name;
				pronouns = ns.Data.Character.Pronouns;
			}
			else if (!!ns.Data.NPCs[replParams[0]])
			{
				name = ns.Data.NPCs[replParams[0]].DisplayName;
				pronouns = ns.Data.NPCs[replParams[0]].Pronouns;
			}

			switch (replParams[1].toLowerCase())
			{
				case "name":
					textAry[i] = name;
					break;
				case "subjective":
					textAry[i] = pronouns.Subjective;
					break;
				case "objective":
					textAry[i] = pronouns.Objective;
					break;
				case "possessive":
					textAry[i] = pronouns.Possessive;
					break;
				case "reflexive":
					textAry[i] = pronouns.Reflexive;
					break;
				case "possessiveadjective":
					textAry[i] = pronouns.PossessiveAdjective;
					break;
				default:
					textAry[i] = `@${replParams[0]}-ERROR@`;
			}
		}
		newText = textAry.join("");
		return newText;
	};
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	const ns = Pages.DungeoneerInterface;
	//#region Standard setup
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
		"ALT+P": {
			action: () => { ns.MetaControl.setActiveTab("metaPane_tab_Player"); },
			description: "Show player information"
		},
		"ALT+I": {
			action: () => { ns.MetaControl.setActiveTab("metaPane_tab_Inventory"); },
			description: "Show inventory"
		},
		"ALT+O": {
			action: () => { ns.MetaControl.setActiveTab("metaPane_tab_World"); },
			description: "Show world information"
		},
		"ALT+R": {
			action: () => { document.getElementById("storyContent").focus() },
			description: "Focus story text"
		},
		"ALT+C": {
			action: () =>
			{
				const consoleEl = document.getElementById("consoleInput");
				consoleEl.focus();
				consoleEl.select();
			},
			description: "Focus input console"
		},
		"ALT+U": {
			action: () => { document.getElementById("consoleOutput").focus(); },
			description: "Focus console output"
		},
	});
	//#endregion

	//#region Meta Pane
	ns.MetaControl = new Common.Controls.PageControl.PageControl(
		document.getElementById("metaPane"),
		document.getElementById("metaPane_ts"),
		document.getElementById("metaPane_pgc"),
		{
			"metaPane_tab_Player": document.getElementById("metaPane_page_Player"),
			"metaPane_tab_Inventory": document.getElementById("metaPane_page_Inventory"),
			"metaPane_tab_World": document.getElementById("metaPane_page_World"),
		},
		"No Tab Selected",
		"Meta Pane"
	);

	const saveUploadEl = document.getElementById("saveUpload");
	saveUploadEl.addEventListener('change', (changeEv) =>
	{
		Common.FileLib.parseJSONFile(
			changeEv.target.files[0],
			Common.fcd(ns, ns.saveUploaded, [changeEv.target.files[0].name])
		);
	});
	//#endregion

	//#region Console
	ns.InputConsole = new ns.Console(
		document.getElementById("consoleForm"),
		document.getElementById("consoleInput"),
		document.getElementById("consoleInputLabel"),
		document.getElementById("consoleOutput")
	);
	//#endregion

	window.addEventListener("resize", ns.resizeListener);
	ns.resizeListener();
};

//window.onbeforeunload = (event) =>
//{
//	event.preventDefault();
//	return false;
//};