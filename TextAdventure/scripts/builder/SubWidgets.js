/**
 * Sub-widget components
 */
registerNamespace("Pages.DungeonBuilder.Controls", function (ns)
{
	//#region Saveable Subwidgets
	ns.SAVEABLE_SUBWIDGET_TAG_NAMES = ["gw-db-string-array", "gw-db-object-array"];

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
			this.setBasicInputData(data);
			this.setSubWidgetData(data);
		}

		registerHandlers()
		{
			throw new Error("registerHandlers is not implemented");
		}

		getData()
		{
			const data = {};
			this.getSubWidgetData(data);
			this.getBasicInputData(data);
			return data
		}

		getSubWidgetData(data)
		{
			data = data || {};
			const subWidgets = [];
			for (const swTag of ns.SAVEABLE_SUBWIDGET_TAG_NAMES)
			{
				subWidgets.push(...this.getElementsByTagName(swTag));
			}

			for (const subWidget of subWidgets)
			{
				if (subWidget.dataProperty && subWidget.getAttribute("dataOwner") === this.idKey)
				{
					data[subWidget.dataProperty] = subWidget.getData();
				}
			}
			return data;
		}

		getBasicInputData(data)
		{
			data = data || {};

			for (let inputEl of this.getAllInputUIEls())
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					data[inputEl.getAttribute("data-prop")] = inputEl.value || null;
				}
			}
			return data;
		}

		setBasicInputData(data)
		{
			for (let inputEl of this.getAllInputUIEls())
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					inputEl.value = data[inputEl.getAttribute("data-prop")] || null;
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
				if (subWidget.dataProperty && subWidget.getAttribute("dataOwner") === this.idKey)
				{
					subWidget.renderData(data[subWidget.dataProperty]);
				}
			}
			return data;
		}

		getAllInputUIEls()
		{
			return [
				...this.getElementsByTagName("input"),
				...this.getElementsByTagName("textarea"),
				...this.getElementsByTagName("select")
			];
		};
	};

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
			const linkBtnMarkup = `<gw-db-widget-link
				id=${this.idKey}-line-linkBtn-${lineNum} 
				networkedWidget=${this.networkedWidget} 
				idInputElId=${inputId}>
			</gw-db-widget-link>`;
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
			const rmBtnEl = lineEl.removeButton;

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
	//#endregion

	//#region SubWidget Objects
	ns.SubWidgetObject = class SubWidgetObject extends ns.SaveableSubWidget
	{
		//#region staticProperties
		//#endregion

		//#region instance properties
		listIdx;

		//#region element properties
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

		get removeButton()
		{
			throw new Error("get removeButton is not implemented");
		}

		setListIndex()
		{
			throw new Error("setListIndex is not implemented");
		}

		setFirstFocus()
		{
			throw new Error("setFirstFocus is not implemented");
		}
	};

	ns.StoryTextObjEl = class StoryTextObjEl extends ns.SubWidgetObject
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
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "story-text-obj";
		}

		get removeButton()
		{
			return this.rmBtnEl;
		}

		setListIndex(idx)
		{
			this.listIdx = idx;
			this.legendEl.innerText = `${this.displayName} ${this.listIdx}`;
		}

		setFirstFocus()
		{
			this.rmBtnEl.focus();
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				<legend id=${this.idKey}-legend>${this.displayName} ${this.listIdx}</legend>
				<div class="obj-el-header">
					<button id="${this.idKey}-btnRemove" class="rm-obj-btn"></button>
				</div>
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
			this.rmBtnEl = document.getElementById(`${this.idKey}-btnRemove`);
			this.legendEl = document.getElementById(`${this.idKey}-legend`);

			document.getElementById(`${this.idKey}-prereqAry`).gridEl.insertAdjacentHTML("afterbegin", `
			<label for="${this.idKey}-prereqOperator">Operator</label>
			<select id="${this.idKey}-prereqOperator" data-owner=${this.idKey} data-prop="PrereqsOp">
				<option>OR</option>
				<option>AND</option>
			</select>
			<div></div><div></div>
			`);

			this.rmBtnEl.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["xmark"], "delete"));
		}

		registerHandlers()
		{
		}
	};
	customElements.define("gw-db-story-text-object", ns.StoryTextObjEl);

	ns.PortalObjEl = class PortalObjEl extends ns.SubWidgetObject
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
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		get subWidgetName()
		{
			return "portal-obj";
		}

		get removeButton()
		{
			return this.rmBtnEl;
		}

		setListIndex(idx)
		{
			this.listIdx = idx;
			this.legendEl.innerText = `${this.displayName} ${this.listIdx}`;
		}

		setFirstFocus()
		{
			this.rmBtnEl.focus();
		}

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="background-color-content">
				<legend id=${this.idKey}-legend>${this.displayName} ${this.listIdx}</legend>
				<div class="obj-el-header">
					<button id="${this.idKey}-btnRemove" class="rm-obj-btn"></button>
				</div>
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
					<div class="input-vertical-line" style="width: auto">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									rows="3"></textarea>
					</div>
					<div class="input-vertical-line" style="width: auto">
						<label for="${this.idKey}-accessText">Access Text</label>
						<textarea	id="${this.idKey}-accessText"
									data-owner="${this.idKey}"
									data-prop="AccessText"
									rows="3"></textarea>
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
			this.rmBtnEl = document.getElementById(`${this.idKey}-btnRemove`);
			this.legendEl = document.getElementById(`${this.idKey}-legend`);

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

		registerHandlers()
		{
		}
	};
	customElements.define("gw-db-portal-object", ns.PortalObjEl);
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
	//#endregion
});