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
		if (ns.InputConsole.currentContextName !== "")
		{
			debugger; //This seems bad - prevent / warn?
		}

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

		ns.runEventsArray(areaObj.OnVisit, (text) => { writeParagraphToStoryEl(text); });

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
				"TALK": new ns.ConsoleCommand(
					Common.fcd(this, this.talkToNPC, [areaId]),
					"Chat up an NPC. E.g. 'TALK PERCY'"
				),
				"INVENTORY": new ns.ConsoleCommand(
					Common.fcd(this, this.openInventory),
					"Open the inventory menu. Optionally specify an item, e.g. INVENTORY BOOK"
				),
			},
			undefined,
			{ disableExit: true, autoExit: false },
			""
		));

		//TODO NPC Actions
		ns.InputConsole.echo();

		setTimeout(() => { Common.axAlertPolite("Story text updated; focus with Alt+R"); }, 10);
	};

	ns.lookInArea = function lookInArea(areaId, arg)
	{
		const areaObj = ns.Data.World.Areas[areaId];

		if (!arg)
		{
			//TODO lookable NPCs
			const lookableItemIds = areaObj.Items.filter(itemId => ns.Data.World.Items[itemId].VisibleToAreaLook);
			if (!areaObj.Description && lookableItemIds.length === 0)
			{
				ns.InputConsole.echo("There's nothing to see.");
				return;
			}

			ns.InputConsole.echoQuiet(areaObj.Description);
			lookableItemIds.forEach(itemId =>
			{
				ns.InputConsole.echoQuiet(`You see a <mark>${ns.Data.World.Items[itemId].DisplayName}</mark>`);
			});
			ns.InputConsole.echo();
			return;
		}
		arg = arg.toUpperCase();

		if (arg === "SELF")
		{
			ns.InputConsole.echoQuiet("You decide to look yourself over. Here's what you see:");
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
				return npcObj && npcObj.DisplayName.toUpperCase() === arg;
			})[0]];
		ns.InputConsole.echoQuiet(objOfInterest?.Description || `You don't see anything called ${arg}`);

		ns.InputConsole.addBlocker("lookActions");
		if (objOfInterest && objOfInterest.Actions)
		{
			const lookActions = objOfInterest.Actions.filter(actionObj => actionObj.Mode === "Look");
			lookActions.forEach(lookActionObj => { ns.runLookAction(lookActionObj); });
		}
		ns.InputConsole.removeBlocker("lookActions");

		ns.InputConsole.echo();
	};

	ns.accessPortal = function accessPortal(areaId, arg)
	{
		const areaObj = ns.Data.World.Areas[areaId];

		if (!arg)
		{
			ns.InputConsole.echo("Please be more specific.");
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
			ns.enterArea(portalObj.Destination); //criteria eval echo'd out from here
		}
		else
		{
			ns.InputConsole.echo(portalObj.AccessDeniedText);
		}
	};
	//#endregion Areas

	//#region Items
	ns.getItemFromArea = function getItemFromArea(areaId, itemArg)
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
			return;
		}

		ns.runItemAction(matchedId, matchedPickUpAction, areaObj);
	};

	ns.interactWithAreaItem = function interactWithAreaItem(areaId, itemArg)
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

		ns.interactWithItem(matchedId, areaObj, true);
	};

	ns.openInventory = function openInventory(itemArg)
	{
		const commandObj = {};
		const nameSet = {};
		const playerAreaObj = ns.Data.World.Areas[ns.Character.Data.Location];
		ns.Character.Data.Inventory.forEach(invItemObj =>
		{
			const itemObj = ns.Data.World.Items[invItemObj.Item];
			let displayName = itemObj.DisplayName.toUpperCase();
			if (nameSet[displayName] && nameSet[displayName] !== invItemObj.Item)
			{
				displayName = displayName + " " + invItemObj.Item.toUpperCase();
			}
			nameSet[displayName] = invItemObj.Item;
			commandObj[displayName] = new ns.ConsoleCommand(
				Common.fcd(this, this.interactWithItem, [invItemObj.Item, playerAreaObj]),
				itemObj.Description
			);
		});

		const context = new ns.ConsoleContext(
			"Inventory",
			commandObj,
			undefined,
			{ disableExit: false, autoExit: true },
			"Your inventory"
		);
		ns.InputConsole.addContext(context);
		itemArg = (itemArg || "").toUpperCase();
		if (itemArg && nameSet[itemArg])
		{
			ns.interactWithItem(nameSet[itemArg], playerAreaObj).then(() =>
			{
				ns.InputConsole.removeContext();
			});
		}
		else
		{
			ns.InputConsole.help();
		}
	};

	ns.tryInteractWithItemFromButton = function tryInteractWithItemFromButton(itemId)
	{
		if (Object.keys(ns.InputConsole.commands).indexOf("INVENTORY") < 0)
		{
			Common.Controls.Popups.showModal("Inventory", "<p>Cannot access inventory right now</p>");
			return;
		}

		ns.InputConsole.addContext(new ns.ConsoleContext(
			"Inventory",
			{},
			undefined,
			{ disableExit: false, autoExit: true },
			"Your inventory"
		));
		ns.interactWithItem(itemId, ns.Data.World.Areas[ns.Character.Data.Location]).then(() =>
		{
			ns.InputConsole.removeContext();
		});
	};

	ns.interactWithItem = function interactWithItem(itemId, areaObj, ignoreInv)
	{
		const itemObj = ns.Data.World.Items[itemId];
		const charInvListing = ignoreInv
			? null
			: ns.Character.Data.Inventory.filter(charInvObj => charInvObj.Item === itemId)[0];

		const commandObj = {};
		itemObj.Actions.forEach(actionObj =>
		{
			if (actionObj.Mode === "Look")
			{
				return;
			}
			if (actionObj.Mode === "Pick Up" && charInvListing)
			{
				return;
			}
			if (actionObj.Mode === "Put Down" && !charInvListing)
			{
				return;
			}
			if (actionObj.Mode === "Don" && charInvListing && charInvListing.BodyLoc !== "None")
			{
				return;
			}
			if ((actionObj.Mode === "Doff" || actionObj.Mode === "Attack")
				&& ((charInvListing && charInvListing.BodyLoc === "None") || !charInvListing)
			)
			{
				return;
			}

			if (!ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate))
			{
				return;
			}

			commandObj[ns.getActionDisplayName(actionObj)] = new ns.ConsoleCommand(
				Common.fcd(this, this.runItemAction, [itemId, actionObj, areaObj]),
				ns.getActionDescription(actionObj)
			);
		});

		const context = new ns.ConsoleContext(
			itemObj.DisplayName || itemId,
			commandObj,
			undefined,
			{ disableExit: false, autoExit: true },
			itemObj.Description
		);
		ns.InputConsole.addContext(context);
		ns.InputConsole.help();
		return context.promise.then();
	};

	ns.getActionDisplayName = function getActionDisplayName(actionObj)
	{
		if (actionObj.DisplayName)
		{
			return actionObj.DisplayName.toUpperCase();
		}
		switch (actionObj.Mode)
		{
			case "Don":
				return `Don ${actionObj.DonBodyLocation}`.toUpperCase();
			default:
				return actionObj.Mode;
		}
	};

	ns.getActionDescription = function getActionDescription(actionObj)
	{
		let postfix = "";
		switch (actionObj.Mode)
		{
			case "Don":
				postfix = `Don ${actionObj.DonBodyLocation}`;
				break;
			case "Doff":
			case "Attack":
				postfix = actionObj.Mode;
				break;
			default:
				break;
		}
		postfix = postfix ? ` (${postfix})` : "";
		return actionObj.Description
			? `${actionObj.Description}${postfix}`
			: "";
	};

	ns.runItemAction = function runItemAction(itemId, actionObj, areaObj)
	{
		if (!ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate))
		{
			return;
		}
		ns.InputConsole.addBlocker("runItemAction");

		ns.InputConsole.echo(actionObj.TextOnAct);

		switch (actionObj.Mode)
		{
			case "Pick Up":
				ns.Character.addInventoryItem(itemId);
				areaObj.Items.splice(areaObj.Items.indexOf(itemId), 1);
				break;
			case "Put Down":
				ns.Character.removeInventoryItem(itemId);
				areaObj.Items.push(itemId);
				ns.Data.World.Items[itemId].VisibleToAreaLook = true;
				break;
			case "Don":
				ns.Character.donItem(itemId, actionObj.DonBodyLocation);
				break;
			case "Doff":
				ns.Character.doffItem(itemId);
				break;
		}

		ns.runEventsArray(actionObj.Events);

		//TODO NPC Actions
		ns.InputConsole.removeBlocker("runItemAction");
		ns.InputConsole.echo();
	};

	ns.runLookAction = function runLookAction(actionObj)
	{
		if (!ns.evaluateCriteriaArray(actionObj.Prereqs, actionObj.PrereqsOp, actionObj.PrereqsNegate))
		{
			return;
		}

		ns.InputConsole.echo(actionObj.TextOnAct);
		ns.runEventsArray(actionObj.Events);
	};

	ns.itemIsWeapon = function itemIsWeapon(itemId)
	{
		const itemObj = ns.Data.World.Items[itemId];
		return itemObj.Actions.filter(actionObj => actionObj.Mode === "Attack").length > 0;
	};
	//#endregion

	//#region Events
	ns.runEvent = function (eventId, outputDelegate)
	{
		const eventObj = ns.Data.Events[eventId];
		if (!eventObj || eventObj.Occurrences > 0 && eventObj.IsSingleton)
		{
			return;
		}

		eventObj.Occurrences = eventObj.Occurrences || 0;
		if (!ns.evaluateCriteriaArray(eventObj.Coreqs))
		{
			outputDelegate(eventObj.CoreqFailText)
			if (eventObj.AlwaysMarkOccurred)
			{
				eventObj.Occurrences++;
			}
			return;
		}

		eventObj.Occurrences++;
		outputDelegate(eventObj.Description);

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
		eventObj.TriggerEvents.forEach(linkedEventId => ns.runEvent(linkedEventId, outputDelegate));
	};

	ns.runEventsArray = function runEventsArray(eventArray, outputDelegate)
	{
		outputDelegate = outputDelegate || ((text) => { ns.InputConsole.echo(text); });

		ns.InputConsole.addBlocker("runEventsArray");
		eventArray.forEach(eventId => ns.runEvent(eventId, outputDelegate));
		ns.InputConsole.removeBlocker("runEventsArray");
	};
	//#endregion

	//#region NPCs
	ns.talkToNPC = function talkToNPC(areaId, arg)
	{
		const areaObj = ns.Data.World.Areas[areaId];
		if (!arg)
		{
			ns.InputConsole.echo("Talk to whom?");
			return;
		}

		const matchedNPCs = areaObj.NPCs.filter(
			npcId => ns.Data.NPCs[npcId].DisplayName.toUpperCase() === arg.toUpperCase()
		);
		if (!matchedNPCs.length)
		{
			ns.InputConsole.echo(`You can't find anyone called ${arg} who wants to talk to you`);
			return;
		}

		const matchedNPCObj = ns.Data.NPCs[matchedNPCs[0]];

		ns.InputConsole.addBlocker("salutations");
		let spokenSalutationCnt = 0;
		if (matchedNPCObj.Salutations && matchedNPCObj.Salutations.length)
		{
			matchedNPCObj.Salutations.forEach(salutationObj =>
			{
				if (ns.evaluateCriteriaArray(
					salutationObj.Prereqs,
					salutationObj.PrereqsOp,
					salutationObj.PrereqsNegate
				))
				{
					if (!spokenSalutationCnt)
					{
						ns.InputConsole.echo(
							`${matchedNPCObj.Pronouns.Subjective} ${matchedNPCObj.Pronouns.UsePlural ? "say" : "says"}:`
						);
					}
					ns.InputConsole.echo(`<q>${salutationObj.Text}</q>`);
					spokenSalutationCnt++;
				}
			});
		}
		if (!spokenSalutationCnt)
		{
			ns.InputConsole.echo(
				`${matchedNPCObj.Pronouns.Subjective} ${matchedNPCObj.Pronouns.UsePlural ? "regard" : "regards"} you.`
			);
		}
		ns.InputConsole.removeBlocker("salutations");

		const treeCommands = {};
		(matchedNPCObj.DialogTrees || {}).forEach(dialogTreeObj =>
		{
			if (ns.evaluateCriteriaArray(
				dialogTreeObj.Prereqs,
				dialogTreeObj.PrereqsOp,
				dialogTreeObj.PrereqsNegate
			))
			{
				treeCommands[dialogTreeObj.DisplayName] = new ns.ConsoleCommand(
					Common.fcd(this, this.runDialogNode, [dialogTreeObj.StartID, matchedNPCs[0]]),
					dialogTreeObj.Description,
				);
			}
		});

		if (!Object.keys(treeCommands).length)
		{
			ns.InputConsole.echo(`${matchedNPCObj.Pronouns.Subjective} ${matchedNPCObj.Pronouns.UsePlural ? "have" : "has"} nothing further to say.`);
			return;
		}

		ns.InputConsole.addContext(new ns.ConsoleContext(
			matchedNPCObj.DisplayName,
			treeCommands,
			undefined,
			{ disableExit: false, autoExit: true },
			""
		));
		ns.InputConsole.showOrderedList();
	}
	//#endregion

	//#region Dialogs
	ns.runDialogNodeOnNewStack = function runDialogNodeOnNewStack(nodeId, npcId)
	{
		setTimeout(() => { ns.runDialogNode(nodeId, npcId); }, 0);
	}

	ns.runDialogNode = function runDialogNode(nodeId, npcId)
	{
		//TODO
		//TODO replace NPCID with the npc id in the text
	}
	//#endregion

	//#region Criteria
	// TODO enable NPC checking some of these
	ns.evaluateCriteria = function (criteriaId, npcId)
	{
		const criteriaObj = ns.Data.Criteria[criteriaId];

		if (!criteriaObj) { return true; }

		if (!criteriaObj.AllowNPC && !!npcId) { return false; }

		ns.InputConsole.addBlocker("evaluateCriteria");

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
			itemId => criteriaObj.HasItemsDonned
				? ns.Character.hasItemDonned(itemId)
				: ns.Character.hasInventoryItem(itemId)
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

		const skillCheckResults = criteriaObj.SkillChecks.map(skillCheckObj =>
		{
			if (skillCheckObj.IsSingleton && skillCheckObj.ResultSet)
			{
				return skillCheckObj.SingletonResult;
			}

			const result = ns.Mechanics.rollSkillCheck(
				ns.Data.Character,
				skillCheckObj.Skill,
				skillCheckObj.Ability,
				skillCheckObj.DC
			);
			skillCheckObj.ResultSet = true;
			skillCheckObj.SingletonResult = result;
			return result;
		});
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
		ns.InputConsole.removeBlocker("evaluateCriteria");
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