/**
 * Sub-widget components
 */
registerNamespace("Pages.DungeonBuilder.Controls", function (ns)
{
	//#region Saveable Subwidgets
	ns.SAVEABLE_SUBWIDGET_TAG_NAMES = [
		"gw-db-string-array",
		"gw-db-object-array",
		"gw-db-attack",
		"gw-db-vitals",
		"gw-db-pronouns",
		"gw-db-abilities",
		"gw-db-skills",
	];

	/**
	 * "Abstract" class for any widget component bound to a single property
	 */
	ns.SaveableSubWidget = class SaveableSubWidget extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		//#endregion

		//#region instance properties
		instanceId;
		dataProperty;
		parentWidget;
		displayName;

		//#region element properties
		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.initialized = false;
		}

		get subWidgetName()
		{
			throw new Error("get subWidgetName is not implemented");
		}

		get idKey()
		{
			return `gw-db-${this.subWidgetName}-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			this.dataProperty = this.getAttribute("dataProperty") || "";
			this.parentWidget = document.getElementById(this.getAttribute("parentWidgetId"));
			this.displayName = this.getAttribute("displayName") || "";

			this.renderContent();
			this.registerHandlers();
			if (this.parentWidget && this.parentWidget.data && this.parentWidget.data[this.dataProperty])
			{
				this.renderData(this.parentWidget.data[this.dataProperty]);
			}
		}

		disconnectedCallback()
		{
		}

		adoptedCallback()
		{
		}

		attributeChangedCallback(name, oldValue, newValue)
		{
		}
		//#endregion

		renderContent()
		{
			throw new Error("renderContent is not implemented");
		}

		renderData(data)
		{
			data = data || {};
			this.setBasicInputData(data);
			this.setSubWidgetData(data);
		}

		registerHandlers()
		{
			//To be optionally implemented in derived classes
		}

		getData()
		{
			const data = {};
			ns.getSubWidgetData(data, this);
			ns.getBasicInputData(data, this);
			return data;
		}

		ownsSubWidget = (subWidget) =>
		{
			return subWidget.getAttribute("dataOwner") === this.idKey;
		};

		setBasicInputData(data)
		{
			for (let inputEl of ns.getAllInputUIEls(this))
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					switch (inputEl.type)
					{
						case "checkbox":
							inputEl.checked = data[inputEl.getAttribute("data-prop")] || false;
							break;
						default:
							inputEl.value = data[inputEl.getAttribute("data-prop")] || null;
							break;
					}
				}
			}
		}

		setSubWidgetData(data)
		{
			data = data || {};
			const subWidgets = [];
			for (const swTag of ns.SAVEABLE_SUBWIDGET_TAG_NAMES)
			{
				subWidgets.push(...this.getElementsByTagName(swTag));
			}

			for (const subWidget of subWidgets)
			{
				if (subWidget.dataProperty && this.ownsSubWidget(subWidget))
				{
					subWidget.renderData(data[subWidget.dataProperty]);
				}
			}
			return data;
		}
	};

	/**
	 * A representation of an array of strings bound to a single property.
	 * Optionally IDs of pinnable widgets.
	 */
	ns.StringArraySubWidgetEl = class StringArraySubWidgetEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		addName;
		lineIdx;
		linePrefix;
		networkedWidget;

		//#region element properties
		btnAdd;
		lineAry;
		gridEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = StringArraySubWidgetEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			StringArraySubWidgetEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "string-array";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }
			this.addName = this.getAttribute("addName") || "";
			this.linePrefix = this.getAttribute("linePrefix") || "";
			this.networkedWidget = this.getAttribute("networkedWidget") || "";

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		registerHandlers()
		{
			this.btnAdd.addEventListener("click", this.onAddLine);
		}

		onAddLine = (event, value) =>
		{
			const lineNum = this.lineIdx++;

			const lineId = `${this.idKey}-line-${lineNum}`;
			const labelId = `${this.idKey}-line-label-${lineNum}`;
			const inputId = `${this.idKey}-line-input-${lineNum}`;
			const linkBtnMarkup = `
			<gw-db-widget-link
				id=${this.idKey}-line-linkBtn-${lineNum} 
				networkedWidget=${this.networkedWidget} 
				idInputElId=${inputId}>
			</gw-db-widget-link>
			`;
			const rmBtnId = `${this.idKey}-line-rmBtn-${lineNum}`;

			this.btnAdd.insertAdjacentHTML(
				"beforebegin",
				`
				<div id=${lineId} class="string-array-line">
					<label id="${labelId}" for="${inputId}">${this.linePrefix}${this.lineAry.length}</label>
					<input id="${inputId}" type="text" value="${value || ""}" />
					${this.networkedWidget ? linkBtnMarkup : ""}
					<button id=${rmBtnId} class="string-array-line-btn"></button>
				</div>
				`
			);

			const lineEl = document.getElementById(lineId);
			const inputEl = document.getElementById(inputId);
			const rmBtnEl = document.getElementById(rmBtnId);

			this.lineAry.push({
				"lineNum": lineNum,
				"label": document.getElementById(labelId),
				"input": inputEl
			});

			rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["delete-left"]));
			rmBtnEl.addEventListener("click", () =>
			{
				lineEl.remove();
				const delIdx = this.lineAry.findIndex((lineEntry) => { return lineEntry.lineNum === lineNum; });
				this.lineAry.splice(delIdx, 1);

				for (let i = delIdx; i < this.lineAry.length; i++)
				{
					this.lineAry[i].label.innerText = `${this.linePrefix}${i}`;
				}
			});

			if (event)
			{
				inputEl.focus();
			}
		};
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="string-array ${this.networkedWidget ? "id-array" : "string-array"}">
				<legend>${this.displayName}</legend>
				<div id="${this.idKey}-input-grid" class="input-grid">
					<button id="${this.idKey}-btnAddLine" class="full-line">Add ${this.addName}</button>
				</div>
			</fieldset>
			`;

			//element properties
			this.btnAdd = document.getElementById(`${this.idKey}-btnAddLine`);
			this.gridEl = document.getElementById(`${this.idKey}-input-grid`);
		}

		renderData(data)
		{
			for (let i = 0; i < data.length; i++)
			{
				this.onAddLine(undefined, data[i]);
			}
		}

		getData()
		{
			return this.lineAry.map(aryEl => aryEl.input.value);
		}
	};
	customElements.define("gw-db-string-array", ns.StringArraySubWidgetEl);

	/**
	 * A representation of an array of complex objects bound to a single property.
	 * These are "SubWidget Repeated Objects"
	 */
	ns.ObjectArraySubWidgetEl = class ObjectArraySubWidgetEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		displayName;
		addName;
		lineIdx;
		objectTag;

		//#region element properties
		btnAdd;
		lineAry;
		objList;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = ObjectArraySubWidgetEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			ObjectArraySubWidgetEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "object-array";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }
			this.displayName = this.getAttribute("displayName") || "";
			this.addName = this.getAttribute("addName") || "";
			this.objectTag = this.getAttribute("objectTag") || "div";

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		registerHandlers()
		{
			this.btnAdd.addEventListener("click", this.onAddLine);
		}

		onAddLine = (event, value) =>
		{
			const lineNum = this.lineIdx++;
			const lineId = `${this.idKey}-line-${lineNum}`;

			this.objList.insertAdjacentHTML(
				"beforeend",
				`
				<${this.objectTag}	id="${lineId}"
									displayName="${this.addName}"
									listIdx="${this.lineAry.length}">
				</${this.objectTag}>
				`
			);

			const lineEl = document.getElementById(lineId);
			const rmBtnEl = lineEl.rmBtnEl;

			this.lineAry.push({
				"lineNum": lineNum,
				"lineEl": lineEl,
			});

			rmBtnEl?.addEventListener("click", () =>
			{
				lineEl.remove();
				const delIdx = this.lineAry.findIndex((lineEntry) => { return lineEntry.lineNum === lineNum; });
				this.lineAry.splice(delIdx, 1);

				for (let i = delIdx; i < this.lineAry.length; i++)
				{
					this.lineAry[i].lineEl.setListIndex(i);
				}
			});

			if (lineEl.renderData && value)
			{
				lineEl.renderData(value);
			}

			if (event && lineEl.setFirstFocus)
			{
				lineEl.setFirstFocus();
			}
		};

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<hr />
			<div class="button-header">
				<h5>${this.displayName}</h5>
				<div></div>
				<button id="${this.idKey}-btnAddLine" class="full-line">Add ${this.addName}</button>
			</div>
			<div id="${this.idKey}-obj-list"></div>
			`;

			//element properties
			this.btnAdd = document.getElementById(`${this.idKey}-btnAddLine`);
			this.objList = document.getElementById(`${this.idKey}-obj-list`);
		}

		renderData(data)
		{
			for (let i = 0; i < data.length; i++)
			{
				this.onAddLine(undefined, data[i]);
			}
		}
		//#endregion

		getData()
		{
			return this.lineAry.map(lineEntry => lineEntry.lineEl.getData());
		}
	};
	customElements.define("gw-db-object-array", ns.ObjectArraySubWidgetEl);

	/**
	 * A group of properties to describe an "Attack" action.
	 */
	ns.AttackEl = class AttackEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		saveEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = AttackEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			AttackEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "attack";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="attack-fieldset">
				<legend>Attack</legend>
				<div class="attack-fieldset-line" style="justify-content: center;">
					<fieldset class="input-horizontal-flex">
						<legend>Valid targets</legend>
						<div class="input-vertical-line">
							<label for="${this.idKey}-optPlayer">Player</label>
							<input id="${this.idKey}-optPlayer" type="checkbox" data-owner=${this.idKey} data-prop="TargetPlayer"/>
						</div>
						<div class="input-vertical-line">
							<label for="${this.idKey}-optNPC">NPC</label>
							<input id="${this.idKey}-optNPC" type="checkbox" data-owner=${this.idKey} data-prop="TargetNPC"/>
						</div>
						<div class="input-vertical-line">
							<label for="${this.idKey}-optArea">Area</label>
							<input id="${this.idKey}-optArea" type="checkbox" data-owner=${this.idKey} data-prop="TargetArea"/>
						</div>
						<div class="input-vertical-line">
							<label for="${this.idKey}-optItem">Item</label>
							<input id="${this.idKey}-optItem" type="checkbox" data-owner=${this.idKey} data-prop="TargetItem"/>
						</div>
					</fieldset>
				</div>
				<div class="attack-fieldset-line">
					<gw-db-ability-select	id=${this.idKey}-save
											labelText="Save"
											dataOwner=${this.idKey}
											dataProperty="Save">
					</gw-db-ability-select>
					<gw-db-ability-select dataOwner=${this.idKey} dataProperty="Ability"></gw-db-ability-select>
					<gw-db-skill-select id="${this.idKey}-skill" dataOwner=${this.idKey} dataProperty="Skill">
					</gw-db-skill-select>
					<div class="input-vertical-line">
						<label for="${this.idKey}-bonus">Bonus to Hit</label>
						<input id="${this.idKey}-bonus" type="number" data-owner=${this.idKey} data-prop="Bonus"/>
					</div>
				</div>
				<div class="attack-fieldset-line">
					<div class="input-vertical-line">
						<label for="${this.idKey}-rolls">Number of Rolls</label>
						<input id="${this.idKey}-rolls" type="number" data-owner=${this.idKey} data-prop="DmgNumRolls"/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-diceNum">Dice Per Roll</label>
						<div>
							<span>(</span>
							<input id="${this.idKey}-diceNum" type="number" data-owner=${this.idKey} data-prop="DmgDiceNum"/>
						</div>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-diceSides">Sides Per Die</label>
						<div>
							<span>d</span>
							<input id="${this.idKey}-diceSides" type="number" data-owner=${this.idKey} data-prop="DmgDiceSides"/>
						</div>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-diceBonus">Bonus Per Roll</label>
						<div>
							<span>+</span>
							<input id="${this.idKey}-diceBonus" type="number" data-owner=${this.idKey} data-prop="DmgRollBonus"/>
							<span>)</span>
						</div>
					</div>
				</div>
				<div class="attack-fieldset-line">
					<div class="input-vertical-line">
						<label for="${this.idKey}-txtOnMiss">Text for Miss or Save</label>
						<textarea	id="${this.idKey}-txtOnMiss"
									data-owner="${this.idKey}"
									data-prop="TextOnSaveMiss"
									rows="3"
						></textarea>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-txtOnHit">Text for Fail or Hit</label>
						<textarea	id="${this.idKey}-txtOnHit"
									data-owner="${this.idKey}"
									data-prop="TextOnFailHit"
									rows="3"
						></textarea>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.saveEl = document.getElementById(`${this.idKey}-save`);
			this.saveEl.selectEl.insertAdjacentHTML("afterbegin", `<option>None</option>`);

			this.skillEl = document.getElementById(`${this.idKey}-skill`);
			this.skillEl.selectEl.insertAdjacentHTML("afterbegin", `<option>None</option>`);
		}
	};
	customElements.define("gw-db-attack", ns.AttackEl);

	/**
	 * A group of properties to describe a character's vitals.
	 */
	ns.VitalsEl = class VitalsEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = VitalsEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			VitalsEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "vitals";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="vitals-fieldset">
				<legend>Vitals</legend>
				<div class="input-grid widget-grid-input">
					<label for="${this.idKey}-health">Health</label>
					<input	id="${this.idKey}-health"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Health"
					/>
					<label for="${this.idKey}-max-health">Max Health</label>
					<input	id="${this.idKey}-max-health"
							type="number"
							data-owner="${this.idKey}"
							data-prop="MaxHealth"
					/>
				</div>
				<div class="input-grid widget-grid-input">
					<label for="${this.idKey}-evasion">Evasion</label>
					<input	id="${this.idKey}-evasion"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Evasion"
					/>
					<label for="${this.idKey}-max-evasion">Max Evasion</label>
					<input	id="${this.idKey}-max-evasion"
							type="number"
							data-owner="${this.idKey}"
							data-prop="MaxEvasion"
					/>
				</div>
				<div class="input-grid widget-grid-input">
					<label for="${this.idKey}-armor">Armor</label>
					<input	id="${this.idKey}-armor"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Armor"
					/>
					<label for="${this.idKey}-max-armor">Max Armor</label>
					<input	id="${this.idKey}-max-armor"
							type="number"
							data-owner="${this.idKey}"
							data-prop="MaxArmor"
					/>
				</div>
			</fieldset>
			`;

			//element properties

		}
	};
	customElements.define("gw-db-vitals", ns.VitalsEl);

	/**
	 * A group of properties to describe a character's vitals.
	 */
	ns.PronounsEl = class PronounsEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = PronounsEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			PronounsEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "pronouns";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="input-horizontal-flex">
				<legend>Pronouns</legend>
				<div class="input-flex-line">
					<label for="${this.idKey}-subjective">Subjective</label>
					<input	id="${this.idKey}-subjective"
							type="text"
							data-owner="${this.idKey}"
							placeholder="She bought a donut."
							data-prop="Subjective"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-objective">Objective</label>
					<input	id="${this.idKey}-objective"
							type="text"
							data-owner="${this.idKey}"
							placeholder="That's her!"
							data-prop="Objective"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-possessive">Possessive</label>
					<input	id="${this.idKey}-possessive"
							type="text"
							data-owner="${this.idKey}"
							placeholder="The donut is hers."
							data-prop="Possessive"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-reflexive">Reflexive</label>
					<input	id="${this.idKey}-reflexive"
							type="text"
							data-owner="${this.idKey}"
							placeholder="Vera ate it herself."
							data-prop="Reflexive"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-posadj">Possessive Adjective</label>
					<input	id="${this.idKey}-posadj"
							type="text"
							data-owner="${this.idKey}"
							placeholder="That's her donut!"
							data-prop="PossessiveAdjective"
					/>
				</div>
			</fieldset>
			`;

			//element properties

		}
	};
	customElements.define("gw-db-pronouns", ns.PronounsEl);

	/**
	 * A group of properties to describe a character's abilities.
	 */
	ns.AbilitiesEl = class AbilitiesEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		strEl;
		strmodEl;
		chaEl;
		chamodEl;
		dexEl;
		dexmodEl;
		conEl;
		conmodEl;
		intEl;
		intmodEl;
		wisEl;
		wismodEl;
		chaEl;
		chamodEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = AbilitiesEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			AbilitiesEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "abilities";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="abilities-fieldset input-horizontal-flex">
				<legend>Abilities</legend>
				<div class="input-flex-line">
					<label for="${this.idKey}-str">Str</label>
					<input	id="${this.idKey}-str"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Str"
					/>
					<output id="${this.idKey}-strmod" for="${this.idKey}-str"></output>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-dex">Dex</label>
					<input	id="${this.idKey}-dex"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Dex"
					/>
					<output id="${this.idKey}-dexmod" for="${this.idKey}-dex"></output>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-con">Con</label>
					<input	id="${this.idKey}-con"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Con"
					/>
					<output id="${this.idKey}-conmod" for="${this.idKey}-con"></output>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-int">Int</label>
					<input	id="${this.idKey}-int"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Int"
					/>
					<output id="${this.idKey}-intmod" for="${this.idKey}-int"></output>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-wis">Wis</label>
					<input	id="${this.idKey}-wis"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Wis"
					/>
					<output id="${this.idKey}-wismod" for="${this.idKey}-wis"></output>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-cha">Cha</label>
					<input	id="${this.idKey}-cha"
							type="number"
							data-owner="${this.idKey}"
							data-prop="Cha"
					/>
					<output id="${this.idKey}-chamod" for="${this.idKey}-cha"></output>
				</div>
			</fieldset>
			`;

			//element properties
			this.strEl = document.getElementById(`${this.idKey}-str`);
			this.strmodEl = document.getElementById(`${this.idKey}-strmod`);
			this.dexEl = document.getElementById(`${this.idKey}-dex`);
			this.dexmodEl = document.getElementById(`${this.idKey}-dexmod`);
			this.conEl = document.getElementById(`${this.idKey}-con`);
			this.conmodEl = document.getElementById(`${this.idKey}-conmod`);
			this.intEl = document.getElementById(`${this.idKey}-int`);
			this.intmodEl = document.getElementById(`${this.idKey}-intmod`);
			this.wisEl = document.getElementById(`${this.idKey}-wis`);
			this.wismodEl = document.getElementById(`${this.idKey}-wismod`);
			this.chaEl = document.getElementById(`${this.idKey}-cha`);
			this.chamodEl = document.getElementById(`${this.idKey}-chamod`);
		}

		registerHandlers()
		{
			this.strEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.strmodEl]));
			this.dexEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.dexmodEl]));
			this.conEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.conmodEl]));
			this.intEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.intmodEl]));
			this.wisEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.wismodEl]));
			this.chaEl.addEventListener("change", Common.fcd(this, this.onAbilityChange, [this.chamodEl]));
		}

		renderData(data)
		{
			super.renderData(data);

			this.updateModVal(this.strmodEl, this.strEl.value);
			this.updateModVal(this.dexmodEl, this.dexEl.value);
			this.updateModVal(this.conmodEl, this.conEl.value);
			this.updateModVal(this.intmodEl, this.intEl.value);
			this.updateModVal(this.wismodEl, this.wisEl.value);
			this.updateModVal(this.chamodEl, this.chaEl.value);
		}

		onAbilityChange(modEl, event)
		{	
			this.updateModVal(modEl, event.target.value);
		}

		updateModVal(modEl, value)
		{
			if (value === "")
			{
				modEl.innerText = "";
				return;
			}

			const modVal = Pages.DungeoneerInterface.Mechanics.calculateAbilityMod(value);
			modEl.innerText = `(${modVal < 0 ? "-" : "+"}${Math.abs(modVal)})`;
		}
	};
	customElements.define("gw-db-abilities", ns.AbilitiesEl);

	/**
	 * A group of properties to describe a character's skills.
	 */
	ns.SkillsEl = class SkillsEl extends ns.SaveableSubWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = SkillsEl.instanceCount++;
			this.lineIdx = 0;
			this.lineAry = [];

			SkillsEl.instanceMap[this.instanceId] = this;
		}

		get subWidgetName()
		{
			return "skills";
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		//#region Handlers
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="skills-fieldset input-horizontal-flex">
				<legend>Skills</legend>
				<div class="input-flex-line">
					<label for="${this.idKey}-acrobatics">Acrobatics</label>
					<input	id="${this.idKey}-acrobatics"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Acrobatics"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-athletics">Athletics</label>
					<input	id="${this.idKey}-athletics"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Athletics"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-deception">Deception</label>
					<input	id="${this.idKey}-deception"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Deception"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-history">History</label>
					<input	id="${this.idKey}-history"
							type="text"
							data-owner="${this.idKey}"
							data-prop="History"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-insight">Insight</label>
					<input	id="${this.idKey}-insight"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Insight"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-intimidation">Intimidation</label>
					<input	id="${this.idKey}-intimidation"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Intimidation"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-magic">Magic</label>
					<input	id="${this.idKey}-magic"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Magic"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-medicine">Medicine</label>
					<input	id="${this.idKey}-medicine"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Medicine"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-nature">Nature</label>
					<input	id="${this.idKey}-nature"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Nature"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-perception">Perception</label>
					<input	id="${this.idKey}-perception"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Perception"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-performance">Performance</label>
					<input	id="${this.idKey}-performance"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Performance"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-persuasion">Persuasion</label>
					<input	id="${this.idKey}-persuasion"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Persuasion"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-stealth">Stealth</label>
					<input	id="${this.idKey}-stealth"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Stealth"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-survival">Survival</label>
					<input	id="${this.idKey}-survival"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Survival"
					/>
				</div>
				<div class="input-flex-line">
					<label for="${this.idKey}-investigation">Investigation</label>
					<input	id="${this.idKey}-investigation"
							type="text"
							data-owner="${this.idKey}"
							data-prop="Investigation"
					/>
				</div>
			</fieldset>
			`;

			//element properties

		}
	};
	customElements.define("gw-db-skills", ns.SkillsEl);
	//#endregion

	//#region SubWidget Repeated Objects
	ns.SubWidgetRepeatedObj = class SubWidgetRepeatedObj extends ns.SaveableSubWidget
	{
		//#region staticProperties
		//#endregion

		//#region instance properties
		listIdx;

		//#region element properties
		legendEl;
		rmBtnEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();
		}

		connectedCallback()
		{
			if (this.initialized) { return; }
			this.listIdx = this.getAttribute("listIdx") || "0";

			super.connectedCallback();
		}

		setListIndex(idx)
		{
			this.listIdx = idx;
			if (this.legendEl)
			{
				this.legendEl.innerText = `${this.displayName} ${this.listIdx}`;
			}
		}

		setFirstFocus()
		{
			this.rmBtnEl?.focus();
		}

		get standardHeader()
		{
			return `
			<legend id=${this.idKey}-legend>${this.displayName} ${this.listIdx}</legend>
			<div class="obj-el-header">
				<button id="${this.idKey}-btnRemove" class="rm-obj-btn"></button>
			</div>
			`;
		};

		get standardRemoveBtn()
		{
			return document.getElementById(`${this.idKey}-btnRemove`);
		}

		get standardLegend()
		{
			return document.getElementById(`${this.idKey}-legend`);
		}
	};

	//#region Areas
	ns.StoryTextObjEl = class StoryTextObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = StoryTextObjEl.instanceCount++;

			StoryTextObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "story-text-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line centered">
					<gw-db-string-array id="${this.idKey}-prereqAry"
										dataProperty="Prereqs"
										dataOwner="${this.idKey}"
										displayName="Prereqs"
										addName="Prereq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					<div class="input-block">
						<label for="${this.idKey}-displayText">Display Text</label>
						<textarea	id="${this.idKey}-displayText"
									data-owner="${this.idKey}"
									data-prop="Text"
									class="full-width"
									rows="4"></textarea>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			document.getElementById(`${this.idKey}-prereqAry`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator"
					data-owner=${this.idKey}
					data-prop="PrereqsOp"
					data-skipParent="true"
			>
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-story-text-object", ns.StoryTextObjEl);

	ns.PortalObjEl = class PortalObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = PortalObjEl.instanceCount++;

			PortalObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "portal-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line center-align">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-destination">Destination</label>
						<input id="${this.idKey}-destination" type="text" data-owner=${this.idKey} data-prop="Destination" />
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-destination">
						</gw-db-widget-link>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									rows="3"
						></textarea>
					</div>
					<div></div>
				</div>
				<div class="card-line centered">
					<div class="input-block">
						<label for="${this.idKey}-accessText">Access Text</label>
						<textarea	id="${this.idKey}-accessText"
									data-owner="${this.idKey}"
									data-prop="AccessText"
									class="full-width"
									rows="4"></textarea>
					</div>
				</div>
				<div class="card-line">
					<gw-db-string-array id="${this.idKey}-gateVis"
										dataProperty="GateVisibility"
										dataOwner="${this.idKey}"
										displayName="Gate Visibility"
										addName="Gate"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					<gw-db-string-array id="${this.idKey}-gateAccess"
										dataProperty="GateAccess"
										dataOwner="${this.idKey}"
										displayName="Gate Access"
										addName="Gate"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			document.getElementById(`${this.idKey}-gateVis`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-gateVisOperator">Operator</label>
			<select id="${this.idKey}-gateVisOperator" data-owner=${this.idKey} data-prop="GateVisibilityOp">
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);
			document.getElementById(`${this.idKey}-gateAccess`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-gateAccessOperator">Operator</label>
			<select id="${this.idKey}-gateAccessOperator" data-owner=${this.idKey} data-prop="GateAccessOp">
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-portal-object", ns.PortalObjEl);
	//#endregion

	//#region Items
	ns.ActionObjEl = class ActionObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		modeSelectEl;
		attackEl;
		bodyLocEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = ActionObjEl.instanceCount++;

			ActionObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "action-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<div class="input-vertical-line">
						<label for="${this.idKey}-dispName">Display Name</label>
						<input	id="${this.idKey}-dispName"
								type="text"
								data-owner="${this.idKey}"
								data-prop="DisplayName"
						/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									rows="3"
						></textarea>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-textOnAct">Text On-Act</label>
						<textarea	id="${this.idKey}-textOnAct"
									data-owner="${this.idKey}"
									data-prop="TextOnAct"
									rows="3"
						></textarea>
					</div>
					<div></div>
				</div>
				<div class="card-line">
					<gw-db-string-array id="${this.idKey}-prereqs"
										dataProperty="Prereqs"
										dataOwner="${this.idKey}"
										displayName="Prereqs"
										addName="Prereq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					<gw-db-string-array id="${this.idKey}-events"
										dataProperty="Events"
										dataOwner="${this.idKey}"
										displayName="Events"
										addName="Event"
										linePrefix="Event ID "
										networkedWidget="gw-db-event"
					></gw-db-string-array>
					<div class="input-vertical-line">
						<label for="${this.idKey}-mode">Mode</label>
						<select id="${this.idKey}-mode"
								data-owner=${this.idKey}
								data-prop="Mode"
								aria-controls="${this.idKey}-attack ${this.idKey}-bodyLocSelect"
						>
							<option>None</option>
							<option>Don</option>
							<option>Doff</option>
							<option>Put Down</option>
							<option>Attack</option>
						</select>
					</div>
				</div>
				<div id="${this.idKey}-modeLine" class="card-line centered">
					<gw-db-attack	id="${this.idKey}-attack"
									class="hidden"
									dataOwner="${this.idKey}"
									dataProperty="Attack">
					</gw-db-attack>
					<gw-db-bodyloc-select	id="${this.idKey}-bodyLocSelect"
											class="hidden"
											dataOwner=${this.idKey}
											dataProperty="DonBodyLocation">
					</gw-db-bodyloc-select>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;
			this.modeSelectEl = document.getElementById(`${this.idKey}-mode`);
			this.attackEl = document.getElementById(`${this.idKey}-attack`);
			this.bodyLocEl = document.getElementById(`${this.idKey}-bodyLocSelect`);

			document.getElementById(`${this.idKey}-prereqs`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator"
					data-owner=${this.idKey}
					data-prop="PrereqsOp"
					data-skipParent="true"
			>
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}

		renderData(data)
		{
			super.renderData(data);
			this.onModeChange();
		}

		registerHandlers()
		{
			this.modeSelectEl.addEventListener("change", this.onModeChange);
		}

		onModeChange = () =>
		{
			switch (this.modeSelectEl.value)
			{
				case "Attack":
					this.attackEl.classList.remove("hidden");
					this.bodyLocEl.classList.add("hidden");
					break;
				case "Don":
					this.attackEl.classList.add("hidden");
					this.bodyLocEl.classList.remove("hidden");
					break;
				case "None":
				case "Put Down":
				case "Doff":
				default:
					this.attackEl.classList.add("hidden");
					this.bodyLocEl.classList.add("hidden");
					break;
			}
		};
	};
	customElements.define("gw-db-action-object", ns.ActionObjEl);
	//#endregion

	//#region Events
	ns.PlaceItmsObj = class PlaceItmsObj extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = PlaceItmsObj.instanceCount++;

			PlaceItmsObj.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "place-items-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-toLoc">In Location</label>
						<input	id="${this.idKey}-toLoc"
								type="text"
								data-owner="${this.idKey}"
								data-prop="Area"
						/>
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-toLoc">
						</gw-db-widget-link>
					</div>
					<gw-db-string-array id="${this.idKey}-placedItems"
										dataProperty="Items"
										dataOwner="${this.idKey}"
										displayName="Placed Items"
										addName="Item"
										linePrefix="ID "
										networkedWidget="gw-db-item"
					></gw-db-string-array>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-place-items-object", ns.PlaceItmsObj);

	ns.MoveNPCObj = class MoveNPCObj extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		toAreaEl;
		toAreaLinkEl;
		toPartyEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = MoveNPCObj.instanceCount++;

			MoveNPCObj.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "move-npc-object";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-npc">NPC</label>
						<input	id="${this.idKey}-npc"
								type="text"
								data-owner="${this.idKey}"
								data-prop="NPC"
						/>
						<gw-db-widget-link
							id=${this.idKey}-npc-linkBtn
							networkedWidget="gw-db-NPC" 
							idInputElId="${this.idKey}-npc">
						</gw-db-widget-link>
						<label for="${this.idKey}-toArea">To Area</label>
						<input	id="${this.idKey}-toArea"
								type="text"
								data-owner="${this.idKey}"
								data-prop="ToArea"
						/>
						<gw-db-widget-link
							id="${this.idKey}-area-linkBtn"
							networkedWidget="gw-db-Area" 
							idInputElId="${this.idKey}-toArea">
						</gw-db-widget-link>
						<label for="${this.idKey}-toParty">To Party</label>
						<input	id="${this.idKey}-toParty"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="ToParty"
						/>
						<div></div>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;
			this.toAreaEl = document.getElementById(`${this.idKey}-toArea`);
			this.toAreaLinkEl = document.getElementById(`${this.idKey}-area-linkBtn`);
			this.toPartyEl = document.getElementById(`${this.idKey}-toParty`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}

		registerHandlers()
		{
			this.toPartyEl.addEventListener("change", () =>
			{
				if (this.toPartyEl.checked)
				{
					this.toAreaEl.value = "";	
				}
				this.toAreaEl.disabled = this.toPartyEl.checked;
				this.toAreaLinkEl.buttonElement.disabled = this.toPartyEl.checked;
			});
		}
	};
	customElements.define("gw-db-move-npc-object", ns.MoveNPCObj);
	//#endregion

	//#region NPCs
	ns.SalutationObjEl = class SalutationObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = SalutationObjEl.instanceCount++;

			SalutationObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "salutation-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line centered">
					<gw-db-string-array id="${this.idKey}-prereqAry"
										dataProperty="Prereqs"
										dataOwner="${this.idKey}"
										displayName="Prereqs"
										addName="Prereq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					<div class="input-block">
						<label for="${this.idKey}-salutationText">Salutation Text</label>
						<textarea	id="${this.idKey}-salutationText"
									data-owner="${this.idKey}"
									data-prop="Text"
									class="full-width"
									rows="4"></textarea>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			document.getElementById(`${this.idKey}-prereqAry`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator"
					data-owner=${this.idKey}
					data-prop="PrereqsOp"
					data-skipParent="true"
			>
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-salutation-object", ns.SalutationObjEl);

	ns.DialogTreeObjEl = class DialogTreeObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = DialogTreeObjEl.instanceCount++;

			DialogTreeObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "dialog-tree-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-dispName">Display Name</label>
						<input	id="${this.idKey}-dispName"
								type="text"
								data-owner="${this.idKey}"
								data-prop="DisplayName"
						/>
						<div></div>
						<label for="${this.idKey}-start">Dialog Start ID</label>
						<input id="${this.idKey}-start" type="text" data-owner=${this.idKey} data-prop="StartID" />
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-dialog" 
							idInputElId="${this.idKey}-start">
						</gw-db-widget-link>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									rows="3"
						></textarea>
					</div>
					<gw-db-string-array id="${this.idKey}-prereqAry"
										dataProperty="Prereqs"
										dataOwner="${this.idKey}"
										displayName="Prereqs"
										addName="Prereq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			document.getElementById(`${this.idKey}-prereqAry`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator"
					data-owner=${this.idKey}
					data-prop="PrereqsOp"
					data-skipParent="true"
			>
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-dialog-tree-object", ns.DialogTreeObjEl);
	//#endregion

	//#region Dialogs
	ns.DialogResponseObjEl = class DialogResponseObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = DialogResponseObjEl.instanceCount++;

			DialogResponseObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "dialog-response-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-dispName">Display Name</label>
						<input	id="${this.idKey}-dispName"
								type="text"
								data-owner="${this.idKey}"
								data-prop="DisplayName"
						/>
						<div></div>
						<label for="${this.idKey}-tonode">To Node</label>
						<input id="${this.idKey}-tonode" type="text" data-owner=${this.idKey} data-prop="ToNode" />
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-dialog" 
							idInputElId="${this.idKey}-tonode">
						</gw-db-widget-link>
					</div>
					<gw-db-string-array id="${this.idKey}-prereqAry"
										dataProperty="Prereqs"
										dataOwner="${this.idKey}"
										displayName="Prereqs"
										addName="Prereq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
					></gw-db-string-array>
					<gw-db-string-array id="${this.idKey}-eventAry"
										dataProperty="Events"
										dataOwner="${this.idKey}"
										displayName="Events"
										addName="Event"
										linePrefix="Event ID "
										networkedWidget="gw-db-event"
					></gw-db-string-array>
				</div>
				<div class="card-line centered">
					<div class="input-block">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									class="full-width"
									rows="4"
						></textarea>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			document.getElementById(`${this.idKey}-prereqAry`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator"
					data-owner=${this.idKey}
					data-prop="PrereqsOp"
					data-skipParent="true"
			>
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-dialog-response-object", ns.DialogResponseObjEl);
	//#endregion

	//#region Criteria
	ns.SkillCheckObjEl = class SkillCheckObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = SkillCheckObjEl.instanceCount++;

			SkillCheckObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "skill-check-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line">
					<gw-db-skill-select id="${this.idKey}-skill" dataOwner=${this.idKey} dataProperty="Skill">
					</gw-db-skill-select>
					<div class="input-vertical-line">
						<label for="${this.idKey}-dc">Difficulty Class</label>
						<input id="${this.idKey}-dc" type="number" data-owner=${this.idKey} data-prop="DC"/>
					</div>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-skill-check-object", ns.SkillCheckObjEl);
	//#endregion

	//#region Character
	ns.PlayerEquipObjEl = class PlayerEquipObjEl extends ns.SubWidgetRepeatedObj
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties


		//#region element properties
		rmBtnEl;
		legendEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();

			this.instanceId = PlayerEquipObjEl.instanceCount++;

			PlayerEquipObjEl.instanceMap[this.instanceId] = this;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "player-equip-obj";
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				${this.standardHeader}
				<div class="card-line end-align">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-item">Item</label>
						<input id="${this.idKey}-item" type="text" data-owner=${this.idKey} data-prop="Item" />
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-item" 
							idInputElId="${this.idKey}-item">
						</gw-db-widget-link>
					</div>
					<gw-db-bodyloc-select id="${this.idKey}-bodyloc" dataOwner=${this.idKey} dataProperty="BodyLoc">
					</gw-db-bodyloc-select>
				</div>
			</fieldset>
			`;

			//element properties
			this.rmBtnEl = this.standardRemoveBtn;
			this.legendEl = this.standardLegend;

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}
	};
	customElements.define("gw-db-player-equip-object", ns.PlayerEquipObjEl);
	//#endregion

	//#endregion

	//#region Other Components
	ns.WidgetLinkEl = class WidgetLinkEl extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		networkedWidget;
		idInputElId;

		//#region element properties
		buttonElement;
		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.instanceId = WidgetLinkEl.instanceCount++;
			WidgetLinkEl.instanceMap[this.instanceId] = this;
		}

		get idKey()
		{
			return `gw-db-widget-link-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			this.networkedWidget = this.getAttribute("networkedWidget");
			this.idInputElId = this.getAttribute("idInputElId");

			this.renderContent();
			this.registerHandlers();
		}

		disconnectedCallback()
		{
		}

		adoptedCallback()
		{
		}

		attributeChangedCallback(name, oldValue, newValue)
		{
		}
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<button id=${this.idKey} class="link-btn"></button>
			`;

			//element properties
			this.buttonElement = document.getElementById(this.idKey);

			this.buttonElement.appendChild(
				Common.SVGLib.createIcon(Common.SVGLib.Icons["link"], "Pin Linked Widget")
			);
		}

		//#region Handlers
		registerHandlers()
		{
			this.buttonElement.addEventListener("click", () =>
			{
				[...document.getElementsByTagName(this.networkedWidget)].filter(
					widgetEl => widgetEl.getAttribute("logicalId") === document.getElementById(this.idInputElId)?.value
				)[0]?.pinWidget();
			});
		}
		//#endregion
	};
	customElements.define("gw-db-widget-link", ns.WidgetLinkEl);

	ns.BodyLocSelectEl = class BodyLocSelectEl extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		dataOwner;
		propName;

		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.instanceId = BodyLocSelectEl.instanceCount++;
			BodyLocSelectEl.instanceMap[this.instanceId] = this;
		}

		get idKey()
		{
			return `gw-db-bodyloc-select-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			this.dataOwner = this.getAttribute("dataOwner");
			this.dataProperty = this.getAttribute("dataProperty");
			this.setAttribute("dataProperty", "");

			this.renderContent();
			this.registerHandlers();
		}

		disconnectedCallback()
		{
		}

		adoptedCallback()
		{
		}

		attributeChangedCallback(name, oldValue, newValue)
		{
		}
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<div class="input-vertical-line">
				<label for="${this.idKey}-select">Body Location</label>
				<select id="${this.idKey}-select" data-owner=${this.dataOwner} data-prop="${this.dataProperty}">
					<option>Head</option>
					<option>Neck</option>
					<option>Torso</option>
					<option>Belt</option>
					<option>Legs</option>
					<option>Knees</option>
					<option>Feet</option>
					<option>Left Wrist</option>
					<option>Right Wrist</option>
					<option>Left Hand</option>
					<option>Right Hand</option>
					<option>Finger</option>
					<option>None</option>
				</select>
			</div>
			`;

			//element properties

		}

		//#region Handlers
		registerHandlers()
		{
		}
		//#endregion
	};
	customElements.define("gw-db-bodyloc-select", ns.BodyLocSelectEl);

	ns.AbilitySelectEl = class AbilitySelectEl extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		dataOwner;
		propName;
		labelText;
		selectEl;

		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.instanceId = AbilitySelectEl.instanceCount++;
			AbilitySelectEl.instanceMap[this.instanceId] = this;
		}

		get idKey()
		{
			return `gw-db-ability-select-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			this.dataOwner = this.getAttribute("dataOwner");
			this.dataProperty = this.getAttribute("dataProperty");
			this.setAttribute("dataProperty", "");
			this.labelText = this.getAttribute("labelText") || "Ability";

			this.renderContent();
			this.registerHandlers();
		}

		disconnectedCallback()
		{
		}

		adoptedCallback()
		{
		}

		attributeChangedCallback(name, oldValue, newValue)
		{
		}
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<div class="input-vertical-line">
				<label for="${this.idKey}-select">${this.labelText}</label>
				<select id="${this.idKey}-select" data-owner=${this.dataOwner} data-prop="${this.dataProperty}">
					<option>STR</option>
					<option>DEX</option>
					<option>CON</option>
					<option>INT</option>
					<option>WIS</option>
					<option>CHA</option>
				</select>
			</div>
			`;

			//element properties
			this.selectEl = document.getElementById(`${this.idKey}-select`);
		}

		//#region Handlers
		registerHandlers()
		{
		}
		//#endregion
	};
	customElements.define("gw-db-ability-select", ns.AbilitySelectEl);

	ns.SkillSelectEl = class SkillSelectEl extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties
		instanceId;
		dataOwner;
		propName;
		labelText;
		selectEl;

		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.instanceId = SkillSelectEl.instanceCount++;
			SkillSelectEl.instanceMap[this.instanceId] = this;
		}

		get idKey()
		{
			return `gw-db-skill-select-${this.instanceId}`;
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			this.dataOwner = this.getAttribute("dataOwner");
			this.dataProperty = this.getAttribute("dataProperty");
			this.setAttribute("dataProperty", "");
			this.labelText = this.getAttribute("labelText") || "Skill";

			this.renderContent();
			this.registerHandlers();
		}

		disconnectedCallback()
		{
		}

		adoptedCallback()
		{
		}

		attributeChangedCallback(name, oldValue, newValue)
		{
		}
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<div class="input-vertical-line">
				<label for="${this.idKey}-select">${this.labelText}</label>
				<select id="${this.idKey}-select" data-owner=${this.dataOwner} data-prop="${this.dataProperty}">
					<option>Acrobatics</option>
					<option>Athletics</option>
					<option>Deception</option>
					<option>History</option>
					<option>Insight</option>
					<option>Intimidation</option>
					<option>Investigation</option>
					<option>Magic</option>
					<option>Medicine</option>
					<option>Nature</option>
					<option>Perception</option>
					<option>Performance</option>
					<option>Persuasion</option>
					<option>Stealth</option>
					<option>Survival</option>
				</select>
			</div>
			`;

			//element properties
			this.selectEl = document.getElementById(`${this.idKey}-select`);
		}

		//#region Handlers
		registerHandlers()
		{
		}
		//#endregion
	};
	customElements.define("gw-db-skill-select", ns.SkillSelectEl);
	//#endregion
});