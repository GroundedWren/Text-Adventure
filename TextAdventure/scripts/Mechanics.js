/**
 * Game mechanics
 */
registerNamespace("Pages.DungeoneerInterface.Mechanics", function (ns)
{
	Object.defineProperty(ns, "InputConsole", {
		get: function ()
		{
			return Pages.DungeoneerInterface.InputConsole;
		}
	});

	ns.calculateAbilityMod = function(ability)
	{
		var abInt = parseInt(ability);
		return Math.floor((abInt - 10) / 2);
	};

	ns.calcHealthPerLevel = function (abilities)
	{
		return ns.calculateAbilityMod(abilities.Con) + 8;
	};

	ns.calcEvasionPerLevel = function (abilities)
	{
		return ns.calculateAbilityMod(abilities.Dex) + 8;
	};

	ns.rollSkillCheck = function rollSkillCheck(statsObj, skill, ability, dc)
	{
		const skillMod = parseInt(statsObj.Skills[skill]) || 0;
		const abilityMod = ns.calculateAbilityMod(parseInt(statsObj.Abilities[ability]) || 0);

		const result = ns.rollDice(1, 1, 20, skillMod + abilityMod);
		const wasSuccess = result.value >= dc;

		ns.InputConsole.echo(
			`[${statsObj.Name}- ${skill !== "None" ? skill + "-" : ""}${ability} Check: ${result.value}${result.crits ? " (CRIT!)" : ""} (${wasSuccess ? "PASS" : "FAIL"})]`,
			{ holdAlert: true }
		);
		return wasSuccess;
	};

	ns.rollDice = function rollDice(numRolls, dicePerRoll, sides, bonusPerRoll)
	{
		let result = 0;
		let crits = 0;
		for (let i = 0; i < numRolls; i++)
		{
			for (let j = 0; j < dicePerRoll; j++)
			{
				const rollResult = ns.rollDie(sides);
				if (rollResult === sides)
				{
					crits++;
				}
				result += rollResult
			}
			result += bonusPerRoll;
		}
		console.log(`Roll: ${numRolls}(${dicePerRoll}d${sides} + ${bonusPerRoll}) = ${result}`);
		return { value: result, crits: crits };
	}

	ns.rollDie = function rollDIe(sides)
	{
		return Math.floor(Math.random() * sides) + 1;
	}
});