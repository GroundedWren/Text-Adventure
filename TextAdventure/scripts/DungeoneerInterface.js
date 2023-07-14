/**
 * Namespace for DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	//The Meta Page Control
	ns.MetaControl = null;
	ns.InputConsole = null;

	//#region Responsive Layout
	ns.MINI_THRESHOLD = 600;

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
		Common.FileLib.saveJSONFile(
			{ text: "this is text", num: 5 },
			"New Save",
			['.save', '.json']
		);
	};

	ns.__shouldApplySave = false;
	ns.saveUploaded = (filename, saveObj) =>
	{
		Common.Controls.Popups.showModal(
			"Import Save",
			`<h2>${filename}</h2>`
			+ `<p>If you continue, any current data will be overwritten. Continue?</p>`
			+ `<button style="float: right; height: 25px; margin-left: 5px;" onclick="Pages.DungeoneerInterface.__uploadSaveModalAccepted()">`
			+ `Yes</button>`
			+ `<button style="float: right; height: 25px;" onclick="Pages.DungeoneerInterface.__uploadSaveModalRejected()">`
			+ `Never mind</button>`,
			undefined,
			() =>
			{
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
		applyCharacterData();

	};
	function applyMetaData()
	{
		document.getElementById("currentGameTableBody").innerHTML = Object.keys(ns.Data.Meta).map(
			key => `<tr><td>${key}</td><td>${ns.Data.Meta[key]}</td></tr>`
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
			setCharacterName(ns.Data.Character.Name);
			setCharacterPronouns(ns.Data.Character.Pronouns);
			setCharacterAbilities(ns.Data.Character.Abilities)
		}
	};
	setCharacterName = (name) =>
	{
		name = name || "Vera";
		ns.Data.Character.Name = name;
		document.getElementById("tdName").innerText = name;
	};
	setCharacterPronouns = (pro) =>
	{
		pro = pro || {};
		ns.Data.Character.Pronouns = pro;
		document.getElementById("tdPronouns").innerText = `${pro.Subjective}/${pro.Objective}/${pro.Possessive}`;
		document.getElementById("tdPronouns2").innerText = `${pro.Reflexive}/${pro.PossessiveAdjective}`;
	};
	setCharacterLevel = (level) =>
	{
		ns.Data.Character.Level = level || 1;
		document.getElementById("tdLevel").innerText = level;
	};
	setCharacterAbilities = (abilities) =>
	{
		abilities = abilities || {Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10};
		ns.Data.Character.Abilities = abilities;
		document.getElementById("tdStr").innerText = abilities.Str;
		document.getElementById("tdDex").innerText = abilities.Dex;
		document.getElementById("tdCon").innerText = abilities.Con;
		document.getElementById("tdInt").innerText = abilities.Int;
		document.getElementById("tdWis").innerText = abilities.Wis;
		document.getElementById("tdCha").innerText = abilities.Cha;

		const mcam = ns.Mechanics.calculateAbilityMod;
		document.getElementById("tdStrMod").innerText = mcam(abilities.Str);
		document.getElementById("tdDexMod").innerText = mcam(abilities.Dex);
		document.getElementById("tdConMod").innerText = mcam(abilities.Con);
		document.getElementById("tdIntMod").innerText = mcam(abilities.Int);
		document.getElementById("tdWisMod").innerText = mcam(abilities.Wis);
		document.getElementById("tdChaMod").innerText = mcam(abilities.Cha);
	};
	//#endregion

	//#region Console Commands
	ns.onLook = () =>
	{
	};
	//#endregion
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	const ns = Pages.DungeoneerInterface;
	//#region Standard setup
	Common.setUpAccessibility();
	Common.Components.registerShortcuts({
		"ALT+H": {
			action: () => { document.getElementById("homeButton").click(); },
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
		"ALT+Q": {
			action: () => { ns.MetaControl.setActiveTab("metaPane_tab_Equipment"); },
			description: "Show equipment"
		},
		"ALT+O": {
			action: () => { ns.MetaControl.setActiveTab("metaPane_tab_World"); },
			description: "Show world information"
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
			"metaPane_tab_Equipment": document.getElementById("metaPane_page_Equipment"),
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
			Common.fcd(ns, ns.saveUploaded, [changeEv.target.files[0]])
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