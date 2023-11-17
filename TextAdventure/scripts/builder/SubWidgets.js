/**
 * Sub-widget components
 */
registerNamespace("Pages.DungeonBuilder.Controls", function (ns)
{
	ns.SAVEABLE_SUBWIDGET_TAG_NAMES = ["gw-db-string-array"];

	ns.SaveableSubWidget = class SaveableSubWidget extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		//#endregion

		//#region instance properties
		instanceId;
		dataProperty;
		parentWidget;

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

			this.dataProperty = this.getAttribute("dataProperty") || "_";
			this.parentWidget = document.getElementById(this.getAttribute("parentWidgetId"));

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
			throw new Error("renderContent is not implemented");
		}

		renderExistingData()
		{
			if (this.parentWidget.data && this.parentWidget.data[this.dataProperty])
			{
				this.renderData(this.parentWidget.data[this.dataProperty]);
			}
		}

		renderData()
		{
			throw new Error("renderData is not implemented");
		}

		registerHandlers()
		{
			throw new Error("registerHandlers is not implemented");
		}

		getData()
		{
			throw new Error("getData is not implemented");
		}
	};

	ns.StringArraySubWidgetEl = class StringArraySubWidgetEl extends ns.SaveableSubWidget
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
		linePrefix;

		//#region element properties
		btnAdd;
		lineAry;
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
			return "string-array"
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }
			this.displayName = this.getAttribute("displayName") || "";
			this.addName = this.getAttribute("addName") || "";
			this.linePrefix = this.getAttribute("linePrefix") || "";

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
			const rmBtnId = `${this.idKey}-line-rmBtn-${lineNum}`;

			this.btnAdd.insertAdjacentHTML(
				"beforebegin",
				`
				<div id=${lineId} class="string-array-line">
					<label id="${labelId}" for="${inputId}">${this.linePrefix}${this.lineAry.length}</label>
					<input id="${inputId}" type="text" value="${value || ""}" />
					<button id=${rmBtnId} class="string-array-line-delbtn"></button>
				</div>
				`
			);

			const lineEl = document.getElementById(lineId)
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
		}
		//#endregion

		renderContent()
		{
			//Markup
			this.innerHTML = `
			<fieldset class="string-array">
				<legend>${this.displayName}</legend>
				<div id="${this.idKey}-input-grid" class="input-grid">
					<button id="${this.idKey}-btnAddLine" class="full-line">Add ${this.addName}</button>
				</div>
			</fieldset>
			`;

			//element properties
			this.btnAdd = document.getElementById(`${this.idKey}-btnAddLine`);

			this.renderExistingData();
		}

		renderData(data)
		{
			for (let i = 0; i < data.length; i++)
			{
				this.onAddLine(undefined, data[i])
			}
		}

		getData()
		{
			return this.lineAry.map(aryEl => aryEl.input.value);
		}
	}
	customElements.define("gw-db-string-array", ns.StringArraySubWidgetEl);
});