/**
 * Namespace for Home.html
 */
registerNamespace("Pages.Home", function (ns)
{
	ns.toggleMoreUpdates = function ()
	{
		const buttonEl = document.getElementById("moreUpdatesBtn");
		const updatesCardEl = document.getElementById("updatesCard");
		if (updatesCardEl.classList.contains("more"))
		{
			updatesCardEl.classList.remove("more");
			buttonEl.innerText = "Show More Updates";
		}
		else
		{
			updatesCardEl.classList.add("more");
			buttonEl.innerText = "Show Fewer Updates";
		}
	};
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	Common.loadTheme();
	Common.setUpAccessibility();
	Common.SVGLib.insertIcons();
};