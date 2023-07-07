/**
 * Game mechanics
 */
registerNamespace("Pages.DungeoneerInterface.Mechanics", function (ns)
{
	ns.calculateAbilityMod = function(ability)
	{
		return Math.floor((ability - 10) / 2);
	};
});