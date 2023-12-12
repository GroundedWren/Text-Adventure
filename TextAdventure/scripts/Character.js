/**
 * Character control
 */
registerNamespace("Pages.DungeoneerInterface.Character", function (ns)
{
	//#region Shortcut Properties
	Object.defineProperty(ns, "Data", {
		get: function ()
		{
			return Pages.DungeoneerInterface.Data.Character;
		}
	});
	const di = {
		get Mechanics() { return Pages.DungeoneerInterface.Mechanics; }
	};
	//#endregion

	//#region Enums
	ns.Skills = {
		Acrobatics: "Acrobatics",
		Athletics: "Athletics",
		Deception: "Deception",
		History: "History",
		Insight: "Insight",
		Intimidation: "Intimidation",
		Investigation: "Investigation",
		Magic: "Magic",
		Medicine: "Medicine",
		Nature: "Nature",
		Perception: "Perception",
		Performance: "Performance",
		Persuasion: "Persuasion",
		Stealth: "Stealth",
		Survival: "Survival",
	};

	ns.Abilities = {
		Str: "Str",
		Dex: "Dex",
		Con: "Con",
		Int: "Int",
		Wis: "Wis",
		Cha: "Cha",
	};
	//#endregion

	ns.getAbilityModTd = function getAbilityModTd(ability)
	{
		return document.getElementById(`td${ability}Mod`);
	};

	ns.setupFromData = function setupFromData()
	{
		ns.setName(ns.Data.Name);
		ns.setPronouns(ns.Data.Pronouns);
		ns.setLevel(ns.Data.Level);
		ns.setAbilities(ns.Data.Abilities);
		ns.setVitals(ns.Data.Vitals);
		ns.setSkills(ns.Data.Skills);
		ns.setInventory(ns.Data.Inventory);
	};

	//#region Setters
	ns.setName = (name) =>
	{
		name = name || "Vera";
		ns.Data.Name = name;
		document.getElementById("tdName").innerText = name;
	};
	ns.setPronouns = (pro) =>
	{
		pro = pro || {};
		ns.Data.Pronouns = pro;
		document.getElementById("tdPronouns").innerText = `${pro.Subjective}/${pro.Objective}/${pro.Possessive}`;
		document.getElementById("tdPronouns2").innerText = `${pro.Reflexive}/${pro.PossessiveAdjective}`;
	};
	ns.setLevel = (level) =>
	{
		ns.Data.Level = document.getElementById("tdLevel").innerText = level || 1;
	};
	ns.setVitals = (vitals) =>
	{
		var dataVitals = ns.Data.Vitals;

		if (!Common.isNullUndefinedOrEmpty(vitals.MaxHealth))
		{
			dataVitals.MaxHealth = vitals.MaxHealth;
		}
		else if (Common.isNullUndefinedOrEmpty(dataVitals.MaxHealth))
		{
			dataVitals.MaxHealth = (di.Mechanics.calcHealthPerLevel(ns.Data.Abilities) * ns.Data.Level);
		}

		if (!Common.isNullUndefinedOrEmpty(vitals.Health))
		{
			dataVitals.Health = vitals.Health;
		}
		else if (Common.isNullUndefinedOrEmpty(dataVitals.Health))
		{
			dataVitals.Health = dataVitals.MaxHealth;
		}

		if (!Common.isNullUndefinedOrEmpty(vitals.MaxEvasion))
		{
			dataVitals.MaxEvasion = vitals.MaxEvasion;
		}
		else if (Common.isNullUndefinedOrEmpty(dataVitals.MaxEvasion))
		{
			dataVitals.MaxEvasion = (di.Mechanics.calcEvasionPerLevel(ns.Data.Abilities) * ns.Data.Level);
		}

		if (!Common.isNullUndefinedOrEmpty(vitals.Evasion))
		{
			dataVitals.Evasion = vitals.Evasion;
		}
		else if (Common.isNullUndefinedOrEmpty(dataVitals.Evasion))
		{
			dataVitals.Evasion = dataVitals.MaxEvasion;
		}

		if (!Common.isNullUndefinedOrEmpty(vitals.Armor))
		{
			dataVitals.Armor = vitals.Armor;
		}
		else if (Common.isNullUndefinedOrEmpty(dataVitals.Armor))
		{
			dataVitals.Armor = 0;
		}

		document.getElementById("sMaxHealth").innerText = dataVitals.MaxHealth;
		document.getElementById("sHealth").innerText = dataVitals.Health;
		document.getElementById("sMaxEvasion").innerText = dataVitals.MaxEvasion;
		document.getElementById("sEvasion").innerText = dataVitals.Evasion;
		document.getElementById("sArmor").innerText = dataVitals.Armor;
	};

	ns.setAbilities = (abilities) =>
	{
		Object.keys(ns.Data.Abilities).forEach(abi =>
		{
			setAbility(abi, abilities);
			ns.getAbilityModTd(abi).innerText = di.Mechanics.calculateAbilityMod(abilities[abi]);
		});
	};
	function setAbility(abbr, abilities)
	{
		var extAbility = ns.Data.Abilities[abbr];
		let abilityToSet = 10;
		if (!Common.isNullUndefinedOrEmpty(abilities[abbr]))
		{
			abilityToSet = abilities[abbr];
		}
		else if (!Common.isNullUndefinedOrEmpty(extAbbr))
		{
			abilityToSet = extAbility;
		}
		ns.Data.Abilities[abbr] = document.getElementById(`td${abbr}`).innerText = abilityToSet;
	};

	ns.setSkills = (skills) =>
	{
		Object.keys(ns.Skills).forEach(skillNm =>
		{
			const skillVal = skills[skillNm];
			var extSkill = ns.Data.Skills[skillNm];

			ns.Data.Skills[skillNm] = document.getElementById(`td${skillNm}`).innerText = skillVal
				|| extSkill
				|| 0;
		});
	};

	ns.setInventory = function setInventory(inventory)
	{
		inventory.forEach(charInvObj =>
		{
			if (charInvObj.BodyLoc === "None" || !charInvObj.BodyLoc)
			{
				pushToBag(charInvObj.Item);
			}
			else
			{
				pushToBody(charInvObj.Item, charInvObj.BodyLoc);
			}
			updateWeapons(charInvObj.Item, charInvObj.BodyLoc);
		});
	};
	//#endregion

	//#region Inventory
	ns.hasInventoryItem = function hasInventoryItem(itemId)
	{
		return this.Data.Inventory.filter(charItmObj => charItmObj.Item === itemId).length > 0;
	};

	ns.addInventoryItem = function addInventoryItem(itemId)
	{
		ns.Data.Inventory.push({ Item: itemId, "BodyLoc": "None" });

		pushToBag(itemId);
		updateWeapons(itemId, "Bag");
	};

	ns.removeInventoryItem = function removeInventoryItem(itemId)
	{
		let itemIndex = -1;
		for (let i = 0; i < ns.Data.Inventory.length; i++)
		{
			if (ns.Data.Inventory[i].Item === itemId)
			{
				itemIndex = i;
				break;
			}
		}
		if (itemIndex === -1) { return; }

		const oldEntry = ns.Data.Inventory.splice(itemIndex, 1)[0];

		popFromBag(itemId);
		popFromWeapons(itemId);
		popFromBody(oldEntry.BodyLoc);
	};

	ns.donItem = function donItem(itemId, bodyLoc)
	{
		const itemObj = Pages.DungeoneerInterface.Data.World.Items[itemId];
		const extantItem = this.Data.Inventory.filter(charItmObj => charItmObj.Item === itemId)[0];
		if (!extantItem)
		{
			ns.Data.Inventory.push({ Item: itemId, "BodyLoc": bodyLoc });
		}
		else
		{
			extantItem.BodyLoc = bodyLoc;
		}

		popFromBag(itemId);
		pushToBody(itemId, bodyLoc);
		updateWeapons(itemId, bodyLoc);
		ns.setVitals({
			MaxEvasion: parseInt(ns.Data.Vitals.MaxEvasion) + parseInt(itemObj.Evasion || 0),
			Evasion: parseInt(ns.Data.Vitals.Evasion) + parseInt(itemObj.Evasion || 0),
			Armor: parseInt(ns.Data.Vitals.Armor) + parseInt(itemObj.Armor || 0),
		});
	};
	ns.doffItem = function doffItem(itemId)
	{
		const itemObj = Pages.DungeoneerInterface.Data.World.Items[itemId];
		const extantItem = this.Data.Inventory.filter(charItmObj => charItmObj.Item === itemId)[0];
		const prevBodyLoc = extantItem.BodyLoc;
		extantItem.BodyLoc = "None";

		pushToBag(itemId);
		popFromBody(prevBodyLoc);
		updateWeapons(itemId, "Bag");
		ns.setVitals({
			MaxEvasion: parseInt(ns.Data.Vitals.MaxEvasion) - parseInt(itemObj.Evasion || 0),
			Evasion: parseInt(ns.Data.Vitals.Evasion) - parseInt(itemObj.Evasion || 0),
			Armor: parseInt(ns.Data.Vitals.Armor) - parseInt(itemObj.Armor || 0),
		});
	};

	function popFromBag(itemId)
	{
		const { elementId, elementCountId } = getBagIds(itemId);
		if (document.getElementById(elementId))
		{
			const bagCountEl = document.getElementById(elementCountId);
			const bagCount = parseInt(bagCountEl.innerText);
			if (bagCount === 1)
			{
				document.getElementById(elementId).remove();
			}
			else
			{
				bagCountEl.innerText = bagCount - 1;
			}
		}
	}
	function pushToBag(itemId)
	{
		const { elementId, elementButtonId, elementCountId } = getBagIds(itemId);
		const itemName = Pages.DungeoneerInterface.Data.World.Items[itemId].DisplayName;

		const extantBagItemCount = document.getElementById(elementCountId);
		if (extantBagItemCount)
		{
			extantBagItemCount.parentElement.classList.remove("hidden");
			extantBagItemCount.innerText = parseInt(extantBagItemCount.innerText) + 1;
			return;
		}

		const bagList = document.getElementById("bagList");
		bagList.insertAdjacentHTML("afterbegin", `
		<li id="${elementId}"><button id="${elementButtonId}" class="bag-item"><span>${itemName}</span><span class="hidden">(<span id=${elementCountId}>1</span>)</span></button></li>
		`);
		document.getElementById(elementButtonId).onclick = Common.fcd(
			Pages.DungeoneerInterface.Logic,
			Pages.DungeoneerInterface.Logic.tryInteractWithItemFromButton,
			[itemId]
		);
	}

	function popFromWeapons(itemId)
	{
		if (!Pages.DungeoneerInterface.Logic.itemIsWeapon(itemId)) { return; }

		const weaponRow = document.getElementById(getWeaponIds(itemId).elementId);
		if (weaponRow)
		{
			weaponRow.remove();
		}
	}
	function updateWeapons(itemId, bodyLoc)
	{
		if (!Pages.DungeoneerInterface.Logic.itemIsWeapon(itemId)) { return; }

		const { elementId, elementButtonId, elementLocationId } = getWeaponIds(itemId);
		if (document.getElementById(elementId))
		{
			document.getElementById(elementLocationId).innerText = bodyLoc;
			return;
		}

		const itemName = Pages.DungeoneerInterface.Data.World.Items[itemId].DisplayName;
		const weaponsTBody = document.getElementById("WeaponsTBody");

		weaponsTBody.insertAdjacentHTML("afterbegin", `
		<tr id="${elementId}"><th scope="row"><button id=${elementButtonId}>${itemName}</button></th><td id="${elementLocationId}"></td></tr>
		`);
		document.getElementById(elementLocationId).innerText = bodyLoc;
		document.getElementById(elementButtonId).onclick = Common.fcd(
			Pages.DungeoneerInterface.Logic,
			Pages.DungeoneerInterface.Logic.tryInteractWithItemFromButton,
			[itemId]
		);
	}

	function popFromBody(bodyLoc)
	{
		const { tableRowId, itemBtnId, armorCellId, evasionCellId } = getBodyIds(bodyLoc);
		if (!document.getElementById(tableRowId)) { return; }

		document.getElementById(tableRowId).classList.remove("shown");
		document.getElementById(itemBtnId).innerText = "";
		document.getElementById(itemBtnId).onClick = () => { };
		document.getElementById(armorCellId).innerHTML = "";
		document.getElementById(evasionCellId).innerHTML = "";
	}
	function pushToBody(itemId, bodyLoc)
	{
		const itemObj = Pages.DungeoneerInterface.Data.World.Items[itemId];

		const { tableRowId, itemBtnId, armorCellId, evasionCellId } = getBodyIds(bodyLoc);
		document.getElementById(tableRowId).classList.add("shown");
		document.getElementById(itemBtnId).innerText = itemObj.DisplayName;
		document.getElementById(itemBtnId).onclick = Common.fcd(
			Pages.DungeoneerInterface.Logic,
			Pages.DungeoneerInterface.Logic.tryInteractWithItemFromButton,
			[itemId]
		);
		document.getElementById(armorCellId).innerHTML = itemObj.Armor || "0";
		document.getElementById(evasionCellId).innerHTML = itemObj.Evasion || "0";
	}

	function getBagIds(itemId)
	{
		const elementId = `bagItem-${itemId}`;
		return {
			elementId,
			elementButtonId: `$${elementId}-button`,
			elementCountId: `${elementId}-count`
		};
	}

	function getWeaponIds(itemId)
	{
		const elementId = `weaponItem-${itemId}`;
		return {
			elementId,
			elementButtonId: `$${elementId}-button`,
			elementLocationId: `${elementId}-location`
		};
	}

	function getBodyIds(bodyLoc)
	{
		const bodyLocKey = bodyLoc.replaceAll(" ", "_");
		return {
			tableRowId: `${bodyLocKey}Row`,
			itemBtnId: `${bodyLocKey}ItemBtn`,
			armorCellId: `${bodyLocKey}Armor`,
			evasionCellId: `${bodyLocKey}Evasion`,
		};
	}
	//endregion Inventory

	ns.adjustMoney = function adjustMoney(amount)
	{
		ns.Data.Money += amount;
	};

	ns.addExp = function addExp(exp)
	{
		ns.Data.XP += exp;
	};
});