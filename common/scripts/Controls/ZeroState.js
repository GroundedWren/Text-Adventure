﻿registerNamespace("Common.Controls.ZeroState", function (ns)
{
	ns.embedZSC = function(parent, text)
	{
		var SVGLib = Common.SVGLib;
		var svg = SVGLib.createChildElement(
			parent,
			SVGLib.ElementTypes.svg,
			{
				"width": "100%",
				"height": "100%",
				"class": "zero-state-control"
			}
		);

		var svgDefs = SVGLib.createChildElement(svg, SVGLib.ElementTypes.defs);
		const gradientId = "gradId";
		var gradient = SVGLib.createChildElement(
			svgDefs,
			SVGLib.ElementTypes.linearGradient,
			{ "id": gradientId }
		);
		SVGLib.createChildElement(
			gradient,
			SVGLib.ElementTypes.stop,
			{
				"offset": "0%",
				"stop-color": Common.Themes[Common.currentTheme]["--accent-color"],
				"stop-opacity": 0.9
			}
		);
		SVGLib.createChildElement(
			gradient,
			SVGLib.ElementTypes.stop,
			{ "offset": "100%", "stop-opacity": 0 }
		);

		SVGLib.createChildElement(
			svg,
			SVGLib.ElementTypes.rect,
			{
				"x": "0",
				"y": "0",
				"width": "100%",
				"height": "100%",
				"fill": SVGLib.getDefsRef(gradientId)
			}
		);

		const styles = [
			"display: flex",
			"flex-direction: column",
			"align-items: center",
			"justify-content: center",
			"height: 100%",
			"margin-left: 5px",
			"margin-right: 5px",
			"color: var(--heading-color)",
		].join("; ");
		SVGLib.createChildElement(
			svg,
			SVGLib.ElementTypes.foreignObject,
			{
				"x": "0",
				"y": "0",
				"width": "100%",
				"height": "100%",
			},
			`<div style="${styles}">${text}</div>`
		);
		return svg;
	}
});