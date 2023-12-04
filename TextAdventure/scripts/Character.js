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

	ns.getAbilityModTd = function (ability)
	{
		return document.getElementById(`td${ability}Mod`);
	};

	ns.setupFromData = function ()
	{
		ns.setName(ns.Data.Name);
		ns.setPronouns(ns.Data.Pronouns);
		ns.setLevel(ns.Data.Level);
		ns.setAbilities(ns.Data.Abilities);
		ns.setVitals(ns.Data.Vitals);
		ns.setSkills(ns.Data.Skills);
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

		dataVitals.MaxHealth = vitals.MaxHealth
			|| dataVitals.MaxHealth
			|| (di.Mechanics.calcHealthPerLevel(ns.Data.Abilities) * ns.Data.Level);

		dataVitals.Health = vitals.Health
			|| dataVitals.Health
			|| dataVitals.MaxHealth;

		dataVitals.MaxEvasion = vitals.MaxEvasion
			|| dataVitals.MaxEvasion
			|| (di.Mechanics.calcEvasionPerLevel(ns.Data.Abilities) * ns.Data.Level);

		dataVitals.Evasion = vitals.Evasion
			|| dataVitals.Evasion
			|| dataVitals.MaxEvasion;

		dataVitals.MaxArmor = vitals.MaxArmor
			|| dataVitals.MaxArmor
			|| 0;

		dataVitals.Armor = vitals.Armor
			|| dataVitals.Armor
			|| dataVitals.MaxArmor;

		document.getElementById("sMaxHealth").innerText = dataVitals.MaxHealth;
		document.getElementById("sHealth").innerText = dataVitals.Health;
		document.getElementById("sMaxEvasion").innerText = dataVitals.MaxEvasion;
		document.getElementById("sEvasion").innerText = dataVitals.Evasion;
		document.getElementById("sMaxArmor").innerText = dataVitals.MaxArmor;
		document.getElementById("sArmor").innerText = dataVitals.Armor;
	};

	ns.setAbilities = (abilities) =>
	{
		Object.keys(ns.Data.Abilities).forEach(abi =>
		{
			setAbility(abi, abilities);
			ns.getAbilityModTd(abi).innerText = di.Mechanics.calculateAbilityMod(abilities[abi])
		});
	};
	function setAbility(abbr, abilities)
	{
		var extAbility = ns.Data.Abilities[abbr];
		ns.Data.Abilities[abbr] = document.getElementById(`td${abbr}`).innerText = abilities[abbr]
			|| extAbility
			|| 10;
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
	//#endregion

	ns.addInventoryItem = function (itemId)
	{
		ns.Data.Inventory.push({ Item: itemId, "Body Location": "None" });
	}

	ns.removeInventoryItem = function (itemId)
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

		ns.Data.Inventory.splice(itemIndex, 1);
	};

	ns.adjustMoney = function (amount)
	{
		ns.Data.Money += amount;
	};

	ns.addExp = function (exp)
	{
		ns.Data.XP += exp;
	}
});