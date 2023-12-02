/**
 * Game mechanics
 */
registerNamespace("Pages.DungeoneerInterface.Mechanics", function (ns)
{
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

	ns.rollSkillCheck = function rollSkillCheck(statsObj, skill, dc)
	{
		return true; //KJA TODO
	};
});