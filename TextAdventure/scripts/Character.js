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
		ns.setName(ns.Data.Character.Name);
		ns.setPronouns(ns.Data.Character.Pronouns);
		ns.setLevel(ns.Data.Character.Level);
		ns.setAbilities(ns.Data.Character.Abilities);
		ns.setVitals(ns.Data.Character.Vitals);
		ns.setSkills(ns.Data.Character.Skills);
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

		document.getElementById("sMaxHealth").innerText = dataVitals.MaxHealth;
		document.getElementById("sHealth").innerText = dataVitals.Health;
		document.getElementById("sMaxEvasion").innerText = dataVitals.MaxEvasion;
		document.getElementById("sEvasion").innerText = dataVitals.Evasion;
	};

	ns.setAbilities = (abilities) =>
	{
		Object.keys(ns.Data.Abilities).forEach(abi =>
		{
			setAbility(abi, abilities);
			ns.getAbilityModTd(abi).innerText = di.Mechanics.calculateAbilityMod(abi)
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
});