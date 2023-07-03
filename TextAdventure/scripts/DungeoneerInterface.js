/**
 * Namespace for DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	//The Meta Page Control
	ns.MetaControl = null;
	ns.InputConsole = null;

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

	ns.applySaveData = function ()
	{
		document.getElementById("currentGameTableBody").innerHTML = Object.keys(ns.Data.Meta).map(
			key => `<tr><td>${key}</td><td>${ns.Data.Meta[key]}</td></tr>`
		).join("");
		document.getElementById("currentGameMetaCard").classList.remove("hidden");
	};
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
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
	});
	//#endregion

	//#region Meta Pane
	Pages.DungeoneerInterface.MetaControl = new Common.Controls.PageControl.PageControl(
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
			Common.fcd(Pages.DungeoneerInterface, Pages.DungeoneerInterface.saveUploaded, [changeEv.target.files[0]])
		);
	});
	//#endregion

	//#region Console
	Pages.DungeoneerInterface.InputConsole = new Pages.DungeoneerInterface.Console(
		document.getElementById("consoleForm"),
		document.getElementById("consoleInput"),
		document.getElementById("consoleOutput")
	);
	//#endregion
};

window.onbeforeunload = (event) =>
{
	event.preventDefault();
	return false;
};