/**
 * Character control
 */
registerNamespace("Pages.DungeoneerInterface.Character", function (ns)
{
	ns.getData = function ()
	{
		return Pages.DungeoneerInterface.Data.Character;
	};

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
		ns.getData().Name = name;
		document.getElementById("tdName").innerText = name;
	};
	ns.setPronouns = (pro) =>
	{
		pro = pro || {};
		ns.getData().Pronouns = pro;
		document.getElementById("tdPronouns").innerText = `${pro.Subjective}/${pro.Objective}/${pro.Possessive}`;
		document.getElementById("tdPronouns2").innerText = `${pro.Reflexive}/${pro.PossessiveAdjective}`;
	};
	ns.setLevel = (level) =>
	{
		ns.getData().Level = document.getElementById("tdLevel").innerText = level || 1;
	};
	ns.setVitals = (vitals) =>
	{
		var dataVitals = ns.getData().Vitals;

		dataVitals.MaxHealth = vitals.MaxHealth
			|| dataVitals.MaxHealth
			|| (ns.Mechanics.calcHealthPerLevel(ns.getData().Abilities) * ns.getData().Level);

		dataVitals.Health = vitals.Health
			|| dataVitals.Health
			|| dataVitals.MaxHealth;

		dataVitals.MaxEvasion = vitals.MaxEvasion
			|| dataVitals.MaxEvasion
			|| (ns.Mechanics.calcEvasionPerLevel(ns.getData().Abilities) * ns.getData().Level);

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
		const mcam = Pages.DungeoneerInterface.Mechanics.calculateAbilityMod;
		ns.Abilities.forEach(abi =>
		{
			setAbility(abi, abilities);
			ns.getAbilityModTd(abi).innerText = mcam(abi)
		});
	};
	function setAbility(abbr, abilities)
	{
		var extAbility = ns.getData().Abilities[abbr];
		ns.getData().Abilities[abbr] = document.getElementById(`td${abbr}`).innerText = abilities[abbr]
			|| extAbility
			|| 10;
	};

	nd.setSkills = (skills) =>
	{
		ns.Skills.forEach(skillNm =>
		{
			const skillVal = skills[skillNm];
			var extSkill = ns.getData().Skills[skillNm];

			ns.getData().Skills[skillNm] = document.getElementById(`td${skillNm}`).innerText = skillVal
				|| extSkill
				|| 0;
		});
	};
	//#endregion
});