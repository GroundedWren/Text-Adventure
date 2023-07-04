/**
 * File for the console in DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	ns.Console = class Console
	{
		__form = null;
		__consoleInputEl = null;
		__consoleInputLabelEl = null;
		__consoleOutputEl = null;

		__consoleOutputList = null;
		__consoleHelpWindow = null;

		__prevCmds = [];
		__prevCmdIdx = -1;

		__contexts = [];

		dce = Common.DOMLib.createElement;
		dsa = Common.DOMLib.setAttributes;

		__commands = {
			ECHO: new ns.ConsoleCommand(Common.fcd(this, this.echo), "Repeats your input"),
			CLEAR: new ns.ConsoleCommand(Common.fcd(this, this.clear), "Clears console history"),
			HELP: new ns.ConsoleCommand(Common.fcd(this, this.help), "Shows this window :)"),
		};

		//#region Construction
		constructor(form, consoleInput, consoleLabel, consoleOutput)
		{
			this.__form = form;
			this.__consoleInputEl = consoleInput;
			this.__consoleInputLabelEl = consoleLabel;
			this.__consoleOutputEl = consoleOutput;

			this.__consoleOutputList = this.dce("ul", this.__consoleOutputEl, ["hidden"]).el;
			this.__consoleHelpWindow = this.dce("div", this.__consoleOutputEl, ["hidden"]).el;

			consoleForm.addEventListener('submit', event =>
			{
				this.__onSubmit();
				event.preventDefault();
			});

			this.__consoleInputEl.addEventListener('keydown', this.__onInputKeydown);

			this.__updateContextLabel();
		};

		__buildHelpWindow()
		{
			const context = this.__getContext();
			this.__consoleHelpWindow.innerHTML = null;
			this.dce("h2", this.__consoleHelpWindow).el.innerText = "Console Help";
			if (context.helpText)
			{
				this.dce("p", this.__consoleHelpWindow, ["center-text"]).el.innerText = context.helpText;
			}
			const table = this.dce("table", this.__consoleHelpWindow).el;
			const tHead = this.dce("thead", table).el;
			tHead.innerHTML = "<tr><th>Command</th><th>Description</th></tr>";
			const tBody = this.dce("tbody", table).el;

			const commands = context.commands;

			for (const command in commands)
			{
				var tableRow = this.dce("tr", tBody).el;
				this.dce("td", tableRow, ["row-label"]).el.innerText = command;
				this.dce("td", tableRow).el.innerText = commands[command].description;
			}
		};
		//#endregion

		//#region Public methods
		hideAllOutput()
		{
			for (const child of this.__consoleOutputEl.children)
			{
				child.classList.add("hidden");
			}
		};

		addContext(consoleContext)
		{
			consoleContext.commands["HELP"] = this.__commands.HELP;
			consoleContext.setUpPromise();

			if (!consoleContext.disableExit)
			{
				consoleContext.commands["EXIT"] = new ns.ConsoleCommand(
					Common.fcd(this, this.removeContext),
					`Exit ${consoleContext.name}`
				);
			}
			this.__contexts.unshift(consoleContext);
			this.__updateContextLabel();

			return consoleContext.promise;
		};

		removeContext(result)
		{
			this.__contexts[0].resolvePromise(result);
			this.__contexts.shift();
			this.__updateContextLabel();
		};

		addCommand(key, command)
		{
			this.__getContext().commands[key] = command;
		};
		//#endregion

		//#region Commands
		__echoBacklog = "";
		echo(value, alertBehavior)
		{
			this.dce("li", this.__consoleOutputList).el.innerHTML = `${value}`;

			alertBehavior = alertBehavior || {};
			if (alertBehavior.holdAlert)
			{
				this.__echoBacklog = this.__echoBacklog + " " + value;
			}
			else if (!alertBehavior.skipAlert)
			{
				value = this.__echoBacklog + " " + value;
				setTimeout(() => { Common.axAlertPolite(value); }, 10);
				this.__echoBacklog = "";
			}

			this.__showOutputList();
		};

		lineFeed()
		{
			this.dce("li", this.__consoleOutputList).el.innerText="\n";
		};

		clear()
		{
			this.__consoleOutputList.innerHTML = "";
			this.__showOutputList();
		};

		help()
		{
			this.__buildHelpWindow();
			Common.axAlertAssertive("Help table populated in console");

			this.hideAllOutput();
			this.__consoleHelpWindow.classList.remove("hidden");
		};
		//#endregion

		//#region Private methods
		__onInputKeydown = (event) =>
		{
			if (!this.__prevCmds.length) { return; }

			if (event.keyCode === Common.KeyCodes.UpArrow)
			{
				if (++this.__prevCmdIdx >= this.__prevCmds.length)
				{
					this.__prevCmdIdx--;
				}
				this.__consoleInputEl.value = this.__prevCmds[this.__prevCmdIdx];
			}
			else if (event.keyCode === Common.KeyCodes.DownArrow)
			{
				if (--this.__prevCmdIdx <= -1)
				{
					this.__consoleInputEl.value = "";
					this.__prevCmdIdx = -1;
				}
				else
				{
					this.__consoleInputEl.value = this.__prevCmds[this.__prevCmdIdx];
				}
			}
			else if (event.keyCode === Common.KeyCodes.Esc)
			{
				this.__showOutputList();
				event.preventDefault();
			}
			else
			{
				if (event.keyCode === Common.KeyCodes.Backspace
					&& this.__consoleInputEl.value === ""
					&& !this.__getContext().disableExit)
				{
					this.removeContext();
				}
				this.__prevCmdIdx = -1;
			}
		};

		__onSubmit()
		{
			this.__showOutputList();

			const value = this.__consoleInputEl.value;
			this.__recordSubmit(value);

			var commandStr;
			var args;
			if (value.includes(" "))
			{
				commandStr = value.substring(0, value.indexOf(" ")).toUpperCase();
				args = value.substring(value.indexOf(" ") + 1);
			}
			else
			{
				commandStr = value.toUpperCase();
				args = "";
			}

			var context = this.__getContext();

			var cmd = context.commands[commandStr];
			if (cmd)
			{
				var result = cmd.handler(args);
				if (commandStr !== "HELP" && context.autoExit) { this.removeContext(result); }
			}
			else if (context.nullary && (value !== "" || context.disableExit === false))
			{
				var result = context.nullary(value);
				if (context.autoExit) { this.removeContext(result); }
			}
			else
			{
				this.echo(`Command ${commandStr} not recognized. Type help for command information.`);
			}

			this.__consoleInputEl.value = "";
		};

		__recordSubmit(value)
		{
			this.__prevCmds.unshift(value);
			this.dce(
				"li",
				this.__consoleOutputList,
				["user-input"]
			).el.innerHTML = `${this.__consoleInputLabelEl.innerText}${value}`;
		}

		__getContext()
		{
			if (this.__contexts.length)
			{
				return this.__contexts[0];
			}
			return new ns.ConsoleContext("", this.__commands, null, {disableExit: true});
		};

		__updateContextLabel()
		{
			var path = this.__contexts.reverse().map(context => context.name).join("/");
			this.__contexts.reverse();

			this.__consoleInputLabelEl.innerText = path + ">";
		};

		__showOutputList()
		{
			this.hideAllOutput();
			this.__consoleOutputList.classList.remove("hidden");
			this.__consoleOutputList.scrollIntoView(false);
		};
		//#endregion
	};

	ns.ConsoleContext = class ConsoleContext
	{
		name = "";
		commands = {};
		nullary = null;
		disableExit = false;
		autoExit = false;
		helpText = "";
		constructor(name, commands, nullary, exitBehavior, helpText)
		{
			this.name = name;
			this.commands = commands || {};
			Object.keys(commands).forEach(cmdKey =>
			{
				if (!this.commands[cmdKey])
				{
					delete this.commands[cmdKey];
				}
			});
			this.nullary = nullary;

			exitBehavior = exitBehavior || {};
			this.disableExit = !!exitBehavior.disableExit;
			this.autoExit = !!exitBehavior.autoExit;

			this.helpText = helpText;
		};

		promise = null;
		resovePromise = null;
		setUpPromise()
		{
			this.promise = new Promise((resolve) => { this.resolvePromise = resolve; });
		};
	};

	ns.ConsoleCommand = class ConsoleCommand
	{
		handler = null;
		description = "";
		constructor(handler, description)
		{
			this.handler = handler || function () { };
			this.description = description;
		}
	};
});