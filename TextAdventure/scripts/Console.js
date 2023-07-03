/**
 * File for the console in DungeoneerInterface.html
 */
registerNamespace("Pages.DungeoneerInterface", function (ns)
{
	ns.Console = class Console
	{
		__form = null;
		__consoleInputEl = null;
		__consoleOutputEl = null;

		__consoleOutputList = null;
		__consoleHelpWindow = null;

		__prevCmds = [];
		__prevCmdIdx = -1;

		dce = Common.DOMLib.createElement;
		dsa = Common.DOMLib.setAttributes;

		__commands = {
			ECHO: { handler: Common.fcd(this, this.echo), description: "Repeats your input" },
			HELP: { handler: Common.fcd(this, this.help), description: "Shows this window :)" },
		};

		//#region Construction
		constructor(form, consoleInput, consoleOutput)
		{
			this.__form = form;
			this.__consoleInputEl = consoleInput;
			this.__consoleOutputEl = consoleOutput;

			this.__consoleOutputList = this.dce("ul", this.__consoleOutputEl, ["hidden"]).el;
			this.__consoleHelpWindow = this.dce("div", this.__consoleOutputEl, ["hidden"]).el;
			this.__buildHelpWindow();

			consoleForm.addEventListener('submit', event =>
			{
				this.__onSubmit();
				event.preventDefault();
			});

			this.__consoleInputEl.addEventListener('keydown', event =>
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
				else
				{
					this.__prevCmdIdx = -1;
				}
			});
		};

		__buildHelpWindow()
		{
			this.dce("h2", this.__consoleHelpWindow).el.innerText = "Console Help"
			const table = this.dce("table", this.__consoleHelpWindow).el;
			const tHead = this.dce("thead", table).el;
			tHead.innerHTML = "<tr><th>Command</th><th>Description</th></tr>";
			const tBody = this.dce("tbody", table).el;

			for (const command in this.__commands)
			{
				var tableRow = this.dce("tr", tBody).el;
				this.dce("td", tableRow, ["row-label"]).el.innerText = command;
				this.dce("td", tableRow).el.innerText = this.__commands[command].description;
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
		//#endregion

		//#region Private methods
		__onSubmit()
		{
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

			var cmd = this.__commands[commandStr];
			if (cmd)
			{
				cmd.handler(args);
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
			this.dce("li", this.__consoleOutputList, ["user-input"]).el.innerText = `>${value}`;
		}
		//#endregion

		//#region Commands
		echo(value)
		{
			this.dce("li", this.__consoleOutputList).el.innerText = `${value}`;

			this.hideAllOutput();
			this.__consoleOutputList.classList.remove("hidden");
			this.__consoleOutputList.scrollIntoView(false);
		};

		help()
		{
			this.hideAllOutput();
			this.__consoleHelpWindow.classList.remove("hidden");
		};
		//#endregion
	};
});