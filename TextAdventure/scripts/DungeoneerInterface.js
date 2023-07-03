/**
 * Namespace for DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	//The Meta Page Control
	ns.MetaControl = null;
	ns.InputConsole = null;
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