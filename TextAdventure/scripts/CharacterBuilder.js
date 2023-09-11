/**
 * Character builder
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	//#region Prompt build
	ns.setupCharacter = async function ()
	{
		ns.InputConsole.echo("Welcome, adventurer. What is your name?");
		await ns.InputConsole.addContext(new ns.ConsoleContext(
			"NAME",
			{},
			ns.Character.setName,
			{ disableExit: true, autoExit: true },
			"Enter a name for yourself.")
		);
		ns.InputConsole.lineFeed();

		ns.InputConsole.echo("What are your pronouns?", { holdAlert: true });
		ns.InputConsole.echo("Subjective(e.g. he/she/they):");
		const subjective = await ns.InputConsole.addContext(new ns.ConsoleContext(
			"SUBJECTIVE PRONOUN",
			{},
			(result) => result,
			{ disableExit: true, autoExit: true },
			"Also known as a nominative pronoun - this is used as a subject in a sentence. 'She bought a donut'")
		);
		ns.InputConsole.lineFeed();
		ns.InputConsole.echo("Objective (e.g. him/her/them):");
		const objective = await ns.InputConsole.addContext(new ns.ConsoleContext(
			"OBJECTIVE PRONOUN",
			{},
			(result) => result,
			{ disableExit: true, autoExit: true },
			"Used when the pronoun is the object of a verb or preposition. 'That's her!'")
		);
		ns.InputConsole.lineFeed();
		ns.InputConsole.echo("Possessive (e.g. his/hers/theirs):");
		const possessive = await ns.InputConsole.addContext(new ns.ConsoleContext(
			"POSSESSIVE PRONOUN",
			{},
			(result) => result,
			{ disableExit: true, autoExit: true },
			"This pronoun indicates ownership. 'The donut is hers.'")
		);
		ns.InputConsole.lineFeed();
		ns.InputConsole.echo("Reflexive (e.g. himself/herself/themselves):");
		const reflexive = await ns.InputConsole.addContext(new ns.ConsoleContext(
			"REFLEXIVE PRONOUN",
			{},
			(result) => result,
			{ disableExit: true, autoExit: true },
			"Used when the subject is also the object. 'Vera ate the donut herself'")
		);
		ns.InputConsole.lineFeed();
		ns.InputConsole.echo("Possessive Adjective (e.g. his/her/their):");
		const possessiveAdj = await ns.InputConsole.addContext(new ns.ConsoleContext(
			"POSSESSIVE ADJECTIVE",
			{},
			(result) => result,
			{ disableExit: true, autoExit: true },
			"Denotes ownership of the object. 'That's her donut!'")
		);
		ns.InputConsole.lineFeed();
		ns.Character.setPronouns({
			Subjective: subjective.toLowerCase(),
			Objective: objective.toLowerCase(),
			Possessive: possessive.toLowerCase(),
			Reflexive: reflexive.toLowerCase(),
			PossessiveAdjective: possessiveAdj.toLowerCase()
		});		

		ns.Character.setLevel(1);

		var done = false;
		var str;
		var dex;
		var con;
		var int;
		var wis;
		var cha;
		while (!done)
		{
			var points = 27;

			ns.InputConsole.echo(
				"Select ability scores; standard DnD 5e Point Buy. (type help for more information)",
				{ holdAlert: true }
			);

			str = await promptAbility("Strength (STR):", "STR", "Strength determines raw physical ability.", {
				"8": " You don't think you've ever opened a jar by yourself.",
				"9": " Some doors feel kinda heavy.",
				"10": " You're 50/50 on getting a jar open.",
				"11": " Once in a while you accidentally slam a door.",
				"12": " People call you to open jars.",
				"13": " You're thoroughly toned.",
				"14": " You're a known gym-head.",
				"15": " You're an arm-wrestling champion.",
			}, points);
			points -= getPointCost(str);
			dex = await promptAbility("Dexterity (DEX):", "DEX", "Dexterity measures physical agility.", {
				"8": " You always seem to bump into everything.",
				"9": " You've tossed many an apple only to not catch it.",
				"10": " You stub your toe every once in a while.",
				"11": " You're spry.",
				"12": " You don't remember the last time you've dropped something.",
				"13": " You seem to catch most things before they hit the floor.",
				"14": " You've nimbly avoided many bumbling pedestrians.",
				"15": " You do parkour in your spare time.",
			}, points);
			points -= getPointCost(dex);
			con = await promptAbility("Constitution (CON):", "CON", "Constitution measures vital force and overall health.", {
				"8": " You catch a nasty cold every season.",
				"9": " When you do get sick, you're out for a few days.",
				"10": " You shrug off most minor colds.",
				"11": " You can jog at a brisk pace for a good while.",
				"12": " You have a healthy glow about you.",
				"13": " You don't remember the last time you've called in sick.",
				"14": " You don't remember the last time you've coughed.",
				"15": " You have a deep well of youthful energy.",
			}, points);
			points -= getPointCost(con);
			int = await promptAbility("Intelligence (INT):", "INT", "Intelligence measures mental acuity and analytical skill.", {
				"8": " You have a hard time remembering what you had for breakfast.",
				"9": " You usually have to ask people for their names a few times.",
				"10": " You use your fingers to do quick sums.",
				"11": " You can do most sums in your head.",
				"12": " You can do long division in your head.",
				"13": " You can rattle off where you were every day last week.",
				"14": " You're a master of riddles.",
				"15": " 'Oh, the melting point of steel? 1425C - that's 2597F.'",
			}, points);
			points -= getPointCost(int);
			wis = await promptAbility("Wisdom (WIS):", "WIS", "Wisdom measures awareness, insight, and fortitude.", {
				"8": " Tomatoes? In your fruit salad? It's more likely than you think.",
				"9": " You understand tomatoes don't belong anywhere near fruit salad.",
				"10": " You quote an aphorism from time to time.",
				"11": " You can usually tell when someone is selling you something.",
				"12": " You notice when the breeze changes directions.",
				"13": " What you believe, you believe strongly, and with purpose.",
				"14": " You can tell if someone is in an uncomfortable conversation 50 feet away.",
				"15": " You could hold your own against torture.",
			}, points);
			points -= getPointCost(wis);
			cha = await promptAbility("Charisma (CHA):", "CHA", "Charisma measures force of personality and social skill.", {
				"8": " You've learned it's better to keep to yourself.",
				"9": " You're on good terms with most of the people you know.",
				"10": " You have a few close friends.",
				"11": " Most people smile at you in passing.",
				"12": " You can call in favors from most of the people you know.",
				"13": " You have a small crowd of friends.",
				"14": " Why is everything always at a discount?",
				"15": " You could actually talk your way out of a ticket.",
			}, points);
			points -= getPointCost(cha);

			ns.InputConsole.echo(`${points} points remaining`, { holdAlert: true });
			ns.InputConsole.echo("Done? (Y/N)");
			done = await ns.InputConsole.addContext(new ns.ConsoleContext(
				"DONE",
				{
					"Y": new ns.ConsoleCommand(() => true, "Done choosing ability scores"),
					"N": new ns.ConsoleCommand(() => false, "Re-choose scores"),
				},
				undefined,
				{ disableExit: true, autoExit: true })
			);
		}
		ns.Character.setAbilities({ Str: str, Dex: dex, Con: con, Int: int, Wis: wis, Cha: cha });
		ns.Character.setVitals({});
		ns.Character.setSkills({});
	};

	async function promptAbility(prompt, ability, description, helpDescs, points)
	{
		ns.InputConsole.echo(`${points} points remaining`, { holdAlert: true });
		ns.InputConsole.echo(prompt);
		var abi = await ns.InputConsole.addContext(new ns.ConsoleContext(
			ability,
			{
				"8": new ns.ConsoleCommand(() => 8, "Costs 0 points." + helpDescs["8"]),
				"9": points >= 1 ? new ns.ConsoleCommand(() => 9, "Costs 1 point." + helpDescs["9"]) : null,
				"10": points >= 2 ? new ns.ConsoleCommand(() => 10, "Costs 2 points." + helpDescs["10"]) : null,
				"11": points >= 3 ? new ns.ConsoleCommand(() => 11, "Costs 3 points." + helpDescs["11"]) : null,
				"12": points >= 4 ? new ns.ConsoleCommand(() => 12, "Costs 4 points." + helpDescs["12"]) : null,
				"13": points >= 5 ? new ns.ConsoleCommand(() => 13, "Costs 5 points." + helpDescs["13"]) : null,
				"14": points >= 7 ? new ns.ConsoleCommand(() => 14, "Costs 7 points." + helpDescs["14"]) : null,
				"15": points >= 9 ? new ns.ConsoleCommand(() => 15, "Costs 9 points." + helpDescs["15"]) : null,
			},
			undefined,
			{ disableExit: true, autoExit: true },
			description)
		);
		ns.InputConsole.lineFeed();
		return abi;
	};

	function getPointCost(score)
	{
		switch (score)
		{
			case 8:
				return 0;
			case 9:
				return 1;
			case 10:
				return 2;
			case 11:
				return 3;
			case 12:
				return 4;
			case 13:
				return 5;
			case 14:
				return 7;
			case 15:
				return 9;
			default:
				return 0;
		}
	};
	//#endregion
});