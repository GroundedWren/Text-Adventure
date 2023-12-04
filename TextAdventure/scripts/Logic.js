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
	Object.defineProperty(ns, "Character", {
		get: function ()
		{
			return Pages.DungeoneerInterface.Character;
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
		ns.StoryEl.insertAdjacentHTML(
			"beforeend",
			`<p>${Pages.DungeoneerInterface.prepareTextForDisplay(text)}</p>`
		);
	}
	//#endregion

	//#region Areas
	ns.enterArea = function enterArea(areaId)
	{
		ns.Data.Character.Location = areaId;

		const areaObj = ns.Data.World.Areas[areaId];
		areaObj.StoryTexts.forEach(storyTextObj =>
		{
			if (!ns.evaluateCriteriaArray(storyTextObj.Prereqs, storyTextObj.PrereqsOp, storyTextObj.PrereqsNegate))
			{
				return;
			}
			writeParagraphToStoryEl(storyTextObj.Text);
		});

		ns.runEventsArray(areaObj.OnVisit, true);

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
				&& ns.evaluateCriteriaArray(
					portalObj.GateVisibility,
					portalObj.GateVisibilityOp,
					portalObj.GateVisibilityNegate
				);
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
		if (!portalObj || !ns.evaluateCriteriaArray(
			portalObj.GateVisibility,
			portalObj.GateVisibilityOp,
			portalObj.GateVisibilityNegate
		))
		{
			ns.InputConsole.echo(`You don't see a way that looks like ${arg}`);
			return;
		}

		if (ns.evaluateCriteriaArray(portalObj.GateAccess, portalObj.GateAccessOp, portalObj.GateAccessNegate))
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
			actionObj => ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate)
		)[0];
		if (!matchedPickUpAction)
		{
			ns.InputConsole.echo(`You can't pick up the ${itemDisplayName}`);
		}

		ns.runItemAction(matchedId, matchedPickUpAction, areaObj);
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
			if (!ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate))
			{
				return;
			}
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
		ns.InputConsole.help();
	};

	ns.runItemAction = function runItemAction(itemId, actionObj, areaObj)
	{
		if (!ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate))
		{
			return;
		}

		ns.InputConsole.echo(actionObj.TextOnAct, { holdAlert: true });

		switch (actionObj.Mode)
		{
			case "Pick Up":
				ns.Character.addInventoryItem(itemId);
				areaObj.Items.splice(areaObj.Items.indexOf(itemId), 1);
				break;
		}

		ns.runEventsArray(actionObj.Events);

		ns.InputConsole.echo();
	};
	//#endregion

	//#region Events
	ns.runEvent = function (eventId, toStoryText)
	{
		const eventObj = ns.Data.Events[eventId];
		if (!eventObj || eventObj.Occurrences > 0 && eventObj.IsSingleton)
		{
			return;
		}

		eventObj.Occurrences = eventObj.Occurrences || 0;
		if (!ns.evaluateCriteriaArray(eventObj.Coreqs))
		{
			if (toStoryText)
			{
				writeParagraphToStoryEl(eventObj.CoreqFailText);
			}
			else
			{
				ns.InputConsole.echo(eventObj.CoreqFailText, { holdAlert: true });
			}
			if (eventObj.AlwaysMarkOccurred)
			{
				eventObj.Occurrences++;
			}
			return;
		}

		eventObj.Occurrences++;
		if (toStoryText)
		{
			writeParagraphToStoryEl(eventObj.Description);
		}
		else
		{
			ns.InputConsole.echo(eventObj.Description, { holdAlert: true });
		}

		(eventObj.RemoveItems || []).forEach(itemId => { ns.Character.removeInventoryItem(itemId); });
		(eventObj.GetItems || []).forEach(itemId => { ns.Character.addInventoryItem(itemId); });
		(eventObj.PlaceItems || []).forEach(placeItmsObj =>
		{
			let areaObj = ns.Data.World.Areas[placeItmsObj.Area];
			areaObj.Items = areaObj.Items.concat(placeItmsObj.Items);
		});
		//TODO NPC Hostility
		//TODO Dialogs
		//TODO Move NPCs
		//TODO Set location
		eventObj.TriggerEvents.forEach(linkedEventId => ns.runEvent(linkedEventId));
	}

	ns.runEventsArray = function (eventArray, toStoryText)
	{
		eventArray.forEach(eventId => ns.runEvent(eventId, toStoryText));
	}
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
		let npcsInPartyPassed = (npcsInPartyResults.length === 0) || (criteriaObj.NPCsInPartyOp === "OR"
			? npcsInPartyResults.some(result => result)
			: npcsInPartyResults.every(result => result));
		npcsInPartyPassed = criteriaObj.NPCsInPartyNegate ? !npcsInPartyPassed : npcsInPartyPassed;

		const eventsOccurredResults = criteriaObj.EventsOccurred.map(
			eventId => ns.Data.Events[eventId].Occurrences > 0
		);
		let eventsOccurredPassed = (eventsOccurredResults.length === 0) || (criteriaObj.EventsOccurredOp === "OR"
			? eventsOccurredResults.some(result => result)
			: eventsOccurredResults.every(result => result));
		eventsOccurredPassed = criteriaObj.EventsOccurredNegate ? !eventsOccurredPassed : eventsOccurredPassed;

		const hasItemsResults = criteriaObj.HasItems.map(
			itemId => ns.Data.Character.Inventory.filter(charItmObj => charItmObj.Item === itemId).length > 0
		);
		let hasItemsPassed = (hasItemsResults.length === 0) || (criteriaObj.HasItemsOp === "OR"
			? hasItemsResults.some(result => result)
			: hasItemsResults.every(result => result));
		hasItemsPassed = criteriaObj.HasItemsNegate ? !hasItemsPassed : hasItemsPassed;

		const inAreaPassed = !!criteriaObj.InArea
			? ns.Data.Character.Location === criteriaObj.InArea
			: true;

		const levelPassed = !!criteriaObj.LeveledTo
			? ns.Data.Character.Level >= criteriaObj.LeveledTo
			: true;

		const itemsByPlayerResults = criteriaObj.ItemsByPlayer.map(
			itemId => ns.Data.World.Areas[ns.Data.Character.Location].Items.indexOf(itemId) >= 0
		);
		let itemsByPlayerPassed = (itemsByPlayerResults.length === 0) || (criteriaObj.ItemsByPlayerOp === "OR"
			? itemsByPlayerResults.some(result => result)
			: itemsByPlayerResults.every(result => result));
		itemsByPlayerPassed = criteriaObj.ItemsByPlayerNegate ? !itemsByPlayerPassed : itemsByPlayerPassed;

		const skillCheckResults = criteriaObj.SkillChecks.map(skillCheckObj => ns.Mechanics.rollSkillCheck(
			ns.Data.Character,
			skillCheckObj.Skill,
			skillCheckObj.Ability,
			skillCheckObj.DC
		));
		const skillChecksPassed = (skillCheckResults.length === 0) || (criteriaObj.SkillChecksOperator === "OR"
			? skillCheckResults.some(result => result)
			: skillCheckResults.every(result => result));

		const moneyPassed = !criteriaObj.HasMoney || (ns.Data.Character.Money >= criteriaObj.HasMoney);

		const didThisPass = npcsInPartyPassed
			&& eventsOccurredPassed
			&& hasItemsPassed
			&& inAreaPassed
			&& levelPassed
			&& itemsByPlayerPassed
			&& skillChecksPassed
			&& moneyPassed;

		const orCriteriaResults = criteriaObj.OR.map(orCriteriaId => ns.evaluateCriteria(orCriteriaId, npcId));
		const didORPass = orCriteriaResults.some(result => result);

		const andCriteriaResults = criteriaObj.AND.map(andCriteriaId => ns.evaluateCriteria(andCriteriaId, npcId));
		const didANDPass = (andCriteriaResults.length === 0) || andCriteriaResults.every(result => result);

		const pentultimateResult = (didThisPass || didORPass) & didANDPass;
		return criteriaObj.NegateResult ? !pentultimateResult : pentultimateResult;
	};

	ns.evaluateCriteriaArray = function (criteriaArray, operator, negate, npcId)
	{
		if (criteriaArray.length === 0) { return true; }
		const result = operator === "OR"
			? criteriaArray.some(criteriaId => ns.evaluateCriteria(criteriaId, npcId))
			: criteriaArray.every(criteriaId => ns.evaluateCriteria(criteriaId, npcId));
		return negate ? !result : result;
	};
	//#endregion
});