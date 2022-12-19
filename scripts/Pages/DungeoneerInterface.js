/**
 * Namespace for Dungeonner Interface.html
 */
registerNamespace("Pages.DI", function (ns)
{
	function showAboutInfo()
	{
		Common.Controls.Popups.showModal(
			"Dungeoneer Interface",
			"Welcome to the Dungeoneer Interface - a text-based RPG player!"
			+ "<br />More info to come :)"
		);
	};
	ns.showAboutInfo = showAboutInfo;
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	DI.Console.registerElements(
		document.getElementById("consoleInput"),
		document.getElementById("consoleInputLabel"),
		document.getElementById("consoleHistory"),
		document.getElementById("historyList")
	);
};

window.onbeforeunload = (event) =>
{
	event.preventDefault();
	return false;
};