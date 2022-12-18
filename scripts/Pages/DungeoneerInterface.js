/**
 * Namespace for Dungeonner Interface.html
 */
registerNamespace("Pages.DI", function (ns)
{

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