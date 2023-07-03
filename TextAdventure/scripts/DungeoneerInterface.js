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

	//#region Console Commands
	ns.onLook = () =>
	{
		ns.InputConsole.echo("You look around. Of note is a DOOR, a BROOM, and a TABLE");
		ns.InputConsole.addContext(new ns.ConsoleContext("LOOK", {
			"DOOR": new ns.ConsoleCommand(
				() => { ns.InputConsole.echo("Wow, cool door."); },
				"Look at the door"
			),
			"BROOM": new ns.ConsoleCommand(
				() => { ns.InputConsole.echo("You could do some serious sweeping with this baby"); },
				"Look at the broom"
			),
			"TABLE": new ns.ConsoleCommand(
				() =>
				{
					ns.InputConsole.echo("There's a card on the table. Pick it up? (Y/N)");
					ns.InputConsole.addContext(new ns.ConsoleContext("PROMPT", {
						"Y": new ns.ConsoleCommand(() => { ns.InputConsole.echo("It's the Jack of Hearts"); ns.InputConsole.removeContext(); }, "Pick up the card"),
						"N": new ns.ConsoleCommand(() => { ns.InputConsole.echo("You walk away"); ns.InputConsole.removeContext(); }, "Leave the card"),
					}, undefined, true));
				},
				"Look at the table"
			),
		}, ns.lookAtDefault));
	};
	ns.lookAtDefault = (target) =>
	{
		ns.InputConsole.echo(`${target}? What ${target}?`);
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
	ns.InputConsole.addCommand("LOOK", new ns.ConsoleCommand(ns.onLook, "Look around the space"));
	//#endregion
};

//window.onbeforeunload = (event) =>
//{
//	event.preventDefault();
//	return false;
//};