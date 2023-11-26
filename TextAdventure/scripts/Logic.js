/**
 * Game logic
 */
registerNamespace("Pages.DungeoneerInterface.Logic", function (ns)
{
	//#region Shortcut Properties
	Object.defineProperty(ns, "Data", {
		get: function ()
		{
			return Pages.DungeoneerInterface.Data;
		}
	});
	Object.defineProperty(ns, "InputConsole", {
		get: function ()
		{
			return Pages.DungeoneerInterface.InputConsole;
		}
	});
	Object.defineProperty(ns, "ConsoleContext", {
		get: function ()
		{
			return Pages.DungeoneerInterface.ConsoleContext;
		}
	});
	Object.defineProperty(ns, "ConsoleCommand", {
		get: function ()
		{
			return Pages.DungeoneerInterface.ConsoleCommand;
		}
	});
	Object.defineProperty(ns, "Mechanics", {
		get: function ()
		{
			return Pages.DungeoneerInterface.Mechanics;
		}
	});
	Object.defineProperty(ns, "StoryEl", {
		get: function ()
		{
			return document.getElementById("storyPane");
		}
	});
	//#endregion

	//#region StoryText
	function writeParagraphToStoryEl(text)
	{
		ns.StoryEl.insertAdjacentHTML("beforeend", `<p>${ns.prepareTextForStoryPane(text)}</p>`);
	}
	ns.prepareTextForStoryPane = function prepareTextForStoryPane(text)
	{
		let newText = text.replaceAll("\n", "<br />");
		let textAry = newText.split("@");
		for (let i = 1; i < textAry.length; i += 2)
		{
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
	//#endregion

	//#region Areas
	ns.enterArea = function enterArea(areaId)
	{
		ns.Data.Character.Location = areaId;

		const areaObj = ns.Data.World.Areas[areaId];
		areaObj.StoryTexts.forEach(storyTextObj =>
		{
			if (!ns.evaluateCriteriaArray(storyTextObj.Prereqs, storyTextObj.PrereqsOp))
			{
				return;
			}
			writeParagraphToStoryEl(storyTextObj.Text);
		});
		//TODO Events On-Visit

		ns.InputConsole.addContext(new ns.ConsoleContext(
			areaObj.DisplayName || areaId,
			{
				"LOOK": new ns.ConsoleCommand(
					Common.fcd(this, this.lookInArea, [areaId]),
					"Can be in particular or in general. E.g. 'LOOK', 'LOOK TABLE', 'LOOK SELF'"
				),
				"GO": new ns.ConsoleCommand(
					Common.fcd(this, this.accessPortal, [areaId]),
					"Try to get somewhere in particular. E.g. 'GO EAST', 'GO DOOR'"
				),
			},
			undefined,
			{ disableExit: true, autoExit: false },
			"")
		);

		setTimeout(() => { Common.axAlertPolite("Story text updated; focus with Alt+T"); }, 10);
	};

	ns.lookInArea = function lookInArea(areaId, arg)
	{
		const areaObj = ns.Data.World.Areas[areaId];

		if (!arg)
		{
			ns.InputConsole.echo(areaObj.Description || "There's nothing to see.");
			return;
		}
		arg = arg.toUpperCase();

		if (arg === "SELF")
		{
			ns.InputConsole.echo("You decide to look yourself over. Here's what you see:", { holdAlert: true });
			ns.InputConsole.echo(ns.Data.Character.Description || "You're just a regular person.");
			return;
		}

		let objOfInterest = areaObj.Portals.filter(portalObj =>
		{
			return (portalObj.DisplayName.toUpperCase() === arg)
				&& ns.evaluateCriteriaArray(portalObj.GateVisibility, portalObj.GateVisibilityOp);
		})[0];

		objOfInterest = objOfInterest
			|| ns.Data.World.Items[areaObj.Items.filter(itemId =>
			{
				const itemObj = ns.Data.World.Items[itemId];
				return itemObj && itemObj.DisplayName.toUpperCase() === arg;
			})[0]]
			|| ns.Data.NPCs[areaObj.NPCs.filter(npcId =>
			{
				const npcObj = ns.Data.NPCs[npcId];
				npcObj && npcObj.DisplayName.toUpperCase() === arg;
			})[0]];
		ns.InputConsole.echo(objOfInterest?.Description || `You don't see anything called ${arg}`);
	};

	ns.accessPortal = function accessPortal(areaId, arg)
	{
		const areaObj = ns.Data.World.Areas[areaId];

		if (!arg)
		{
			ns.InputConsole.echo("You need to be more specific.");
			return;
		}
		arg = arg.toUpperCase();

		const portalObj = areaObj.Portals.filter(portalObj => portalObj.DisplayName.toUpperCase() == arg)[0];
		if (!portalObj || !ns.evaluateCriteriaArray(portalObj.GateVisibility, portalObj.GateVisibilityOp))
		{
			ns.InputConsole.echo(`You don't see a way that looks like ${arg}`);
			return;
		}

		if (ns.evaluateCriteriaArray(portalObj.GateAccess, portalObj.GateAccessOp))
		{
			ns.InputConsole.removeContext();
			ns.StoryEl.innerHTML = "";

			writeParagraphToStoryEl(portalObj.AccessText);
			ns.enterArea(portalObj.Destination);
		}
		else
		{
			ns.InputConsole.echo(portalObj.AccessDeniedText);
		}
	}
	//#endregion Areas

	//#region Items
	//#endregion

	//#region Events
	//#endregion

	//#region NPCs
	//#endregion

	//#region Dialogs
	//#endregion

	//#region Criteria
	ns.evaluateCriteria = function (criteriaId, npcId)
	{
		return true; //KJA TODO
	};

	ns.evaluateCriteriaArray = function (criteriaArray, operator, npcId)
	{
		if (criteriaArray.length === 0) { return true; }
		return operator === "OR"
			? criteriaArray.some(criteriaId => ns.evaluateCriteria(criteriaId, npcId))
			: criteriaArray.every(criteriaId => ns.evaluateCriteria(criteriaId, npcId));
	};
	//#endregion
});