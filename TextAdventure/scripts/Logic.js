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
			return document.getElementById("storyContent");
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
					"Try to get somewhere in particular. E.g. 'GO EAST', 'GO DOOR ON THE LEFT'"
				),
				"GET": new ns.ConsoleCommand(
					Common.fcd(this, this.getItemFromArea, [areaId]),
					"Try to pick something up to bring with you. E.g. 'GET MYSTERIOUS TALISMAN', 'GET LETTER'"
				),
				"INTERACT": new ns.ConsoleCommand(
					Common.fcd(this, this.interactWithAreaItem, [areaId]),
					"Begin to interact with some specific item. Will display more options. E.g. 'INTERACT CHEST'"
				),
			},
			undefined,
			{ disableExit: true, autoExit: false },
			""
		));

		setTimeout(() => { Common.axAlertPolite("Story text updated; focus with Alt+R"); }, 10);
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
	};
	//#endregion Areas

	//#region Items
	ns.getItemFromArea = function (areaId, itemArg)
	{
		const itemDisplayName = itemArg.toUpperCase();
		const areaObj = ns.Data.World.Areas[areaId];

		const matchedId = areaObj.Items.filter(itemId =>
			ns.Data.World.Items[itemId]?.DisplayName.toUpperCase() === itemDisplayName
		)[0];
		if (!matchedId)
		{
			ns.InputConsole.echo(`You don't see anything like ${itemDisplayName} you can pick up`);
			return;
		}

		const itemObj = ns.Data.World.Items[matchedId];
		const pickUpActions = itemObj.Actions.filter(actionObj => actionObj.Mode === "Pick Up");
		const matchedPickUpAction = pickUpActions.filter(
			actionObj => ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp)
		)[0];
		if (!matchedPickUpAction)
		{
			ns.InputConsole.echo(`You can't pick up the ${itemDisplayName}`);
		}

		ns.runItemAction(itemObj, matchedPickUpAction);
	};

	ns.interactWithAreaItem = function (areaId, itemArg)
	{
		const itemDisplayName = itemArg.toUpperCase();
		const areaObj = ns.Data.World.Areas[areaId];

		const matchedId = areaObj.Items.filter(itemId =>
			ns.Data.World.Items[itemId]?.DisplayName.toUpperCase() === itemDisplayName
		)[0];
		if (!matchedId)
		{
			ns.InputConsole.echo(`You don't see anything like ${itemDisplayName} you can interact with`);
			return;
		}

		const itemObj = ns.Data.World.Items[matchedId];
		const commandObj = {};
		itemObj.Actions.forEach(actionObj =>
		{
			const commandStr = (actionObj.DisplayName || actionObj.Mode).replaceAll(" ", "-").toUpperCase();
			commandObj[commandStr] = new ns.ConsoleCommand(
				Common.fcd(this, this.runItemAction, [matchedId, actionObj, areaObj]),
				actionObj.Description
			);
		});
		ns.InputConsole.addContext(new ns.ConsoleContext(
			itemObj.DisplayName || itemObj.ID,
			commandObj,
			undefined,
			{ disableExit: false, autoExit: true },
			itemObj.Description
		));
	};

	ns.runItemAction = function runItemAction(itemId, actionObj, areaObj)
	{
		const itemObj = ns.Data.World.Items[itemId];

		ns.InputConsole.echo(actionObj.TextOnAct);

		switch (actionObj.Mode)
		{
			case "Pick Up":
				ns.Data.Character.Inventory.push(itemId);
				areaObj.Items.splice(areaObj.Items.indexOf(itemId), 1);
				break;
		}

		//TODO Events On-Action
	};
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
		const criteriaObj = ns.Data.Criteria[criteriaId];

		if (!criteriaObj) { return true; }

		if (!criteriaObj.AllowNPC && !!npcId) { return false; }

		const npcsInPartyResults = criteriaObj.NPCsInParty.map(
			npcId => ns.Data.Character.Party.indexOf(npcId) >= 0
		);
		const npcsInPartyPassed = (npcsInPartyResults.length === 0) || (criteriaObj.NPCsInPartyOp === "OR"
			? npcsInPartyResults.some(result => result)
			: npcsInPartyResults.every(result => result));

		const eventsOccurredResults = criteriaObj.EventsOccurred.map(
			eventId => ns.Data.Events[eventId].Occurrences > 0
		);
		const eventsOccurredPassed = (eventsOccurredResults.length === 0) || (criteriaObj.EventsOccurredOp === "OR"
			? eventsOccurredResults.some(result => result)
			: eventsOccurredResults.every(result => result));

		const hasItemsResults = criteriaObj.HasItems.map(
			itemId => ns.Data.Character.Inventory.indexOf(itemId) >= 0
		);
		const hasItemsPassed = (hasItemsResults.length === 0) || (criteriaObj.HasItemsOp === "OR"
			? hasItemsResults.some(result => result)
			: hasItemsResults.every(result => result));

		const inAreaPassed = !!criteriaObj.InArea
			? ns.Data.Character.Location === criteriaObj.InArea
			: true;

		const levelPassed = !!criteriaObj.LeveledTo
			? ns.Data.Character.Level >= criteriaObj.LeveledTo
			: true;

		const itemsByPlayerResults = criteriaObj.ItemsByPlayer.map(
			itemId => ns.Data.World.Areas[ns.Data.Character.Location].Items.indexOf(itemId) >= 0
		);
		const itemsByPlayerPassed = (itemsByPlayerResults.length === 0) || (criteriaObj.ItemsByPlayerOp === "OR"
			? itemsByPlayerResults.some(result => result)
			: itemsByPlayerResults.every(result => result));

		const skillCheckResults = criteriaObj.SkillChecks.map(skillCheckObj => ns.Mechanics.rollSkillCheck(
			ns.Data.Character,
			skillCheckObj.Skill,
			skillCheckObj.DC
		));
		const skillChecksPassed = (skillCheckResults.length === 0) || (criteriaObj.SkillChecksOperator === "OR"
			? skillCheckResults.some(result => result)
			: skillCheckResults.every(result => result));

		//TODO money

		const didThisPass = npcsInPartyPassed
			&& eventsOccurredPassed
			&& hasItemsPassed
			&& inAreaPassed
			&& levelPassed
			&& itemsByPlayerPassed
			&& skillChecksPassed;

		const orCriteriaResults = criteriaObj.OR.map(orCriteriaId => ns.evaluateCriteria(orCriteriaId, npcId));
		const didORPass = orCriteriaResults.some(result => result);

		const andCriteriaResults = criteriaObj.AND.map(andCriteriaId => ns.evaluateCriteria(andCriteriaId, npcId));
		const didANDPass = (andCriteriaResults.length === 0) || andCriteriaResults.every(result => result);

		const pentultimateResult = (didThisPass || didORPass) && didANDPass;
		return criteriaObj.NegateResult ? !pentultimateResult : pentultimateResult;
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