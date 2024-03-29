﻿/**
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
		__curCmdIdx = -1;

		__contexts = [];

		__echoBacklog = "";
		__blockers = {};

		dce = Common.DOMLib.createElement;
		dsa = Common.DOMLib.setAttributes;

		__commands = {
			ECHO: new ns.ConsoleCommand(Common.fcd(this, this.echo), "Repeats your input", true),
			CLEAR: new ns.ConsoleCommand(Common.fcd(this, this.clear), "Clears console history", true),
			META: new ns.ConsoleCommand(ns.showMeta, "Shows the metagame panel", true),
			HELP: new ns.ConsoleCommand(Common.fcd(this, this.help), "Shows this window :)", true),
		};

		//#region Construction
		constructor(form, consoleInput, consoleLabel, consoleOutput)
		{
			this.__form = form;
			this.__consoleInputEl = consoleInput;
			this.__consoleInputLabelEl = consoleLabel;
			this.__consoleOutputEl = consoleOutput;

			this.__consoleOutputList = this.dce("ul", this.__consoleOutputEl, undefined, ["hidden"]);
			this.__consoleHelpWindow = this.dce("div", this.__consoleOutputEl, undefined, ["hidden"]);

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
			this.dce("h2", this.__consoleHelpWindow, undefined, undefined, "Console Help");

			const consoleHelpText = context.helpText
				|| "Hint: Use the Up/Down arrow keys to navigate command history. Use Ctrl+Home/Ctrl+End to navigate available commands.";
			this.dce("p", this.__consoleHelpWindow, undefined, ["center-text"], consoleHelpText);

			const table = this.dce("table", this.__consoleHelpWindow);
			this.dce("thead", table, undefined, undefined, "<tr><th>Command</th><th>Description</th></tr>");
			const tBody = this.dce("tbody", table);

			const commands = context.commands;

			for (const command in commands)
			{
				if (command === "META" && !ns.isMiniViewport) { continue; }
				if (command === "HELP") { continue; }

				var tableRow = this.dce("tr", tBody);
				this.dce("th", tableRow, { scope: "row" }, undefined, command);
				this.dce("td", tableRow, undefined, undefined, commands[command].description);
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
			consoleContext.commands["CLEAR"] = this.__commands.CLEAR;
			consoleContext.commands["HELP"] = this.__commands.HELP;
			consoleContext.commands["META"] = this.__commands.META;
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
			this.__showOutputList();
		};

		removeAllContexts()
		{
			while (this.__contexts.length)
			{
				//We're not resolving the promises, so some things are potentially left hanging.
				this.__contexts.shift();
				this.__updateContextLabel();
			}
		}

		addCommand(key, command)
		{
			this.__getContext().commands[key] = command;
		};

		get commands()
		{
			return this.__getContext().commands;
		};

		get commandKeys()
		{
			return Object.keys(this.__getContext().commands);
		};

		get currentContextName()
		{
			return this.__contexts.length ? this.contexts[0].name : "";
		};
		//#endregion

		//#region Commands
		echoQuiet(value)
		{
			this.addBlocker("echoQuiet");
			this.echo(value);
			this.removeBlocker("echoQuiet");
		};

		echo(value)
		{
			if (value)
			{
				this.dce(
					"li",
					this.__consoleOutputList,
					undefined,
					undefined,
					`${Pages.DungeoneerInterface.prepareTextForDisplay(value)}`
				);
			}
			value = value || "";

			if (this.__isBlocked)
			{
				this.__echoBacklog = this.__echoBacklog + " " + value;
			}
			else
			{
				value = this.__echoBacklog + " " + value;
				setTimeout(() => { Common.axAlertPolite(value); }, 10);
				this.__echoBacklog = "";
			}

			this.__showOutputList();
		};

		lineFeed()
		{
			this.dce("li", this.__consoleOutputList, undefined, undefined, "\n");
		};

		clear()
		{
			this.__consoleOutputList.innerHTML = "";
			this.__showOutputList();
		};

		addBlocker(identifier)
		{
			this.__blockers[identifier] = "";
			setTimeout(Common.fcd(this, (identifier) =>
			{
				if (!Common.isNullOrUndefined(this.__blockers[identifier]))
				{
					console.log("Console blocked for more than 5s. Blockers: " + Object.keys(this.__blockers));
					debugger;

					this.removeBlocker(identifier);
					this.echo();
				}
			}, [identifier]), 3000);
		}
		removeBlocker(identifier)
		{
			delete this.__blockers[identifier];
		}
		get __isBlocked()
		{
			return Object.keys(this.__blockers).length > 0;
		}

		showOrderedList()
		{
			if (!this.__getContext().commandShorts.length)
			{
				debugger;
				this.echo();
				return;
			}
			const shorts = this.__getContext().commandShorts;
			let output = "<ol>";
			for (let i = 0; i < shorts.length; i++)
			{
				let cmd = this.commands[shorts[i]];
				output = output + `<li><mark>${shorts[i]}</mark> - ${cmd.description}</li>`;
			}
			output = output + "</ol>";
			this.echo(output);
		};

		help()
		{
			this.__buildHelpWindow();

			this.hideAllOutput();
			this.__consoleHelpWindow.classList.remove("hidden");

			this.__consoleOutputEl.focus();
		};
		//#endregion

		//#region Private methods

		//TODO this is kind of a mess...
		__onInputKeydown = (event) =>
		{
			if (event.keyCode === Common.KeyCodes.UpArrow)
			{
				if (++this.__prevCmdIdx >= this.__prevCmds.length)
				{
					this.__prevCmdIdx--;
				}
				if (this.__prevCmdIdx >= 0 && this.__prevCmdIdx < this.__prevCmds.length)
				{
					this.__consoleInputEl.value = this.__prevCmds[this.__prevCmdIdx];
				}
			}
			else if (event.keyCode === Common.KeyCodes.DownArrow)
			{
				if (--this.__prevCmdIdx <= -1)
				{
					this.__consoleInputEl.value = "";
					this.__prevCmdIdx = -1;
				}
				else if (this.__prevCmdIdx < this.__prevCmds.length)
				{
					this.__consoleInputEl.value = this.__prevCmds[this.__prevCmdIdx];
				}
			}
			else if (event.keyCode == Common.KeyCodes.End && event.ctrlKey)
			{
				if (++this.__curCmdIdx >= this.commandKeys.length)
				{
					this.__curCmdIdx = this.commandKeys.length - 1;
				}
				if (this.__curCmdIdx >= 0 && this.__curCmdIdx < this.commandKeys.length)
				{
					if (this.commandKeys[this.__curCmdIdx] === "META" && !ns.isMiniViewport)
					{
						if ((this.__curCmdIdx === this.commandKeys.length - 1))
						{
							this.__curCmdIdx--;
							return
						}
						this.__onInputKeydown(event);
						return;
					}
					this.__consoleInputEl.value = this.commandKeys[this.__curCmdIdx];
				}
			}
			else if (event.keyCode === Common.KeyCodes.Home && event.ctrlKey)
			{
				if (--this.__curCmdIdx <= -1)
				{
					this.__consoleInputEl.value = "";
					this.__curCmdIdx = -1;
				}
				else if (this.__curCmdIdx < this.commandKeys.length)
				{
					if (this.commandKeys[this.__curCmdIdx] === "META" && !ns.isMiniViewport)
					{
						if (this.__curCmdIdx === 0)
						{
							this.__curCmdIdx++;
							return;
						}
						this.__onInputKeydown(event);
						return;
					}
					this.__consoleInputEl.value = this.commandKeys[this.__curCmdIdx];
					this.__consoleInputEl.setSelectionRange(
						this.__consoleInputEl.value.length,
						this.__consoleInputEl.value.length
					);
					event.preventDefault();
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
					Common.axAlertPolite(`Console exited ${this.__getContext().name}`);
					this.removeContext();
				}
				this.__prevCmdIdx = -1;
				if (event.keyCode !== Common.KeyCodes.LeftArrow
					&& event.keyCode !== Common.KeyCodes.RightArrow
					&& event.keyCode !== Common.KeyCodes.End
					&& event.keyCode !== Common.KeyCodes.Home
				)
				{
					this.__curCmdIdx = -1;
				}
			}
		};

		async __onSubmit()
		{
			this.__showOutputList();

			const value = this.__consoleInputEl.value;
			this.__consoleInputEl.value = "";
			this.__recordSubmit(value);

			var context = this.__getContext();
			const { commandStr, args } = this.__parseCommandFromArgs(value, context);

			var cmd = context.commands[commandStr];
			if (commandStr === "META" && !ns.isMiniViewport) { cmd = null; }

			if (cmd)
			{
				var result = cmd.handler(args);
				if (result && result.then)
				{
					result = await result;
				}
				if (commandStr !== "HELP"
					&& commandStr !== "META"
					&& commandStr !== "EXIT"
					&& context.autoExit
				)
				{
					this.removeContext(result);
				}
			}
			else if (context.nullary && (value !== "" || context.disableExit === false))
			{
				var result = context.nullary(value);
				if (result && result.then)
				{
					result = await result;
				}
				if (context.autoExit)
				{
					this.removeContext(result);
				}
			}
			else
			{
				this.echo(`Command ${commandStr} not recognized. Type help for command information.`);
			}
		};

		__parseCommandFromArgs(value, context)
		{
			let commandStr = "";
			let args = "";

			const wordAry = value.toUpperCase().split(" ");
			let candidate = "";
			while (commandStr === "" && wordAry.length)
			{
				candidate = candidate ? candidate + " " + wordAry.shift() : wordAry.shift();
				let candidateNum = parseInt(candidate);
				if (context.commands[candidate])
				{
					commandStr = candidate;
				}
				else if (!isNaN(candidateNum)
					&& candidateNum > 0
					&& candidateNum <= context.commandShorts.length
				)
				{
					commandStr = context.commandShorts[candidateNum - 1];
				}
			}
			args = wordAry.join(" ");

			return { commandStr, args };
		}

		__recordSubmit(value)
		{
			this.__prevCmds.unshift(value);
			this.dce(
				"li",
				this.__consoleOutputList,
				undefined,
				["user-input"],
				`${this.__consoleInputLabelEl.innerText}${value}`
			);

			this.__showOutputList();
		}

		__getContext()
		{
			if (this.__contexts.length)
			{
				return this.__contexts[0];
			}
			return new ns.ConsoleContext("", this.__commands, null, { disableExit: true });
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

			this.__alignOutputAtEnd();
			setTimeout(() =>
			{
				this.__alignOutputAtEnd();
			}, 10);
		};

		__alignOutputAtEnd()
		{
			window.scrollTo(0, document.body.scrollHeight);
			this.__consoleOutputList.scrollIntoView(false);
		};
		//#endregion
	};

	ns.ConsoleContext = class ConsoleContext
	{
		name = "";
		commands = {};
		commandShorts = [];
		nullary = null;
		disableExit = false;
		autoExit = false;
		helpText = "";
		constructor(name, commands, nullary, exitBehavior, helpText)
		{
			commands = commands || {};

			this.name = name;
			this.commands = {};
			Object.keys(commands).forEach(cmdKey =>
			{
				if (commands[cmdKey])
				{
					this.commandShorts.push(cmdKey.toUpperCase());
					this.commands[cmdKey.toUpperCase()] = commands[cmdKey];
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
		shortcutIdx = null;
		constructor(handler, description)
		{
			this.handler = handler || function () { };
			this.description = description;
		}
	};
});