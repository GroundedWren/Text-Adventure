﻿/**
 * Namespace for index.html
 */
registerNamespace("Pages.Index", function (ns)
{
});

/**
 * Code to be called when the window first loads
 */
window.onload = () =>
{
	var subdomain = window.location.host.split('.')[0].toUpperCase();
	switch (subdomain)
	{
		//case "TEXTADVENTURE":
		//	window.location.href = "./TextAdventure/Home.html";
		//	return;
		//case "GROUNDEDWREN":
		//	window.location.href = "./pages/Home.html";
		//	return;
		default:
			window.location.href = "./pages/Home.html";
	}
};