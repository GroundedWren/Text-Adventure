registerNamespace("Pages.DungeonBuilder.Controls", function (ns)
{
	/**
	 * A base class for all pinnable widgets in the builder
	 */
	ns.PinnableWidget = class PinnableWidget extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		//#endregion

		//#region instance properties
		initialized;
		instanceId;
		logicalId;
		isOpen;
		isPinned;
		homeElId;
		pinnedElId;

		//#region element properties
		btnDelete;
		btnOpen;
		btnClose;
		btnPin;
		titleEl;
		logicalIdInEl;
		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.initialized = false;
		}

		get widgetName()
		{
			throw new Error("get widgetName is not implemented");
		}

		get idKey()
		{
			throw new Error("get idKey is not implemented");
		}

		get data()
		{
			throw new Error("get data is not implemented");
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			this.logicalId = this.getAttribute("logicalId") || this.instanceId;
			this.setAttribute("logicalId", this.logicalId);
			this.isOpen = this.hasAttribute("open");
			this.isPinned = this.getAttribute("pinned") || false;
			this.homeElId = this.getAttribute("homeEL");
			this.pinnedElId = this.getAttribute("pinEl");

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

		//#region Render
		renderContent()
		{
			if (this.isOpen)
			{
				this.renderContentOpen();
			}
			else
			{
				this.renderContentClosed();
			}

			//element properties
			this.btnDelete = document.getElementById(`${this.idKey}-btnDelete`);
			this.btnClose = document.getElementById(`${this.idKey}-btnClose`);
			this.btnOpen = document.getElementById(`${this.idKey}-btnOpen`);
			this.btnPin = document.getElementById(`${this.idKey}-btnPin`);
			this.titleEl = document.getElementById(`${this.idKey}-title`);
			this.logicalIdInEl = document.getElementById(`${this.idKey}-logicalIdInEl`);
		}

		renderContentClosed()
		{
			throw new Error("renderContentClosed is not implemented");
		}

		getClosedHeaderHTML()
		{
			return `
			<div class="card-header">
				<span id="${this.idKey}-title" role="heading" aria-level="4">${this.widgetName} ${this.logicalId}</span>
				<div class=card-header-btns>
					<button id="${this.idKey}-btnDelete">Delete</button>
					<button id="${this.idKey}-btnOpen">Open</button>
					<button id="${this.idKey}-btnPin">${this.isPinned ? "Unpin" : "Pin"}</button>
				</div>
			</div>
			`;
		}

		getOpenHeaderHTML()
		{
			return `
			<div class="card-header">
				<span id="${this.idKey}-title" role="heading" aria-level="4">${this.widgetName} ${this.logicalId}</span>
				<div class="card-header-btns">
					<button id="${this.idKey}-btnDelete">Delete</button>
					<button id="${this.idKey}-btnClose">Close</button>
					<button id="${this.idKey}-btnPin">${this.isPinned ? "Unpin" : "Pin"}</button>
				</div>
			</div>
			`;
		}

		renderContentOpen()
		{
			throw new Error("renderContentOpen is not implemented");
		}
		//#endregion

		//#region Handlers
		registerHandlers()
		{
			this.btnDelete.onclick = () =>
			{
				Common.Controls.Popups.showModal(
					`Delete ${this.widgetName}`,
					`<p><strong>Permanently</strong> delete ${this.widgetName} ${this.instanceId}?</p><br />`
					+ `<button id="confirmBtn" style="float: right; height: 25px; margin-left: 5px;">`
					+ `Delete</button>`
					+ `<button id="abortBtn" style="float: right; height: 25px;">`
					+ `Go back</button>`
				);
				document.getElementById("confirmBtn").onclick = this.onDelete;
				document.getElementById("abortBtn").onclick = this.onAbortDelete;
			};

			this.btnPin.onclick = this.pinWidget;

			if (this.isOpen)
			{
				this.registerHandlersOpen();
			}
			else
			{
				this.registerHandlersClosed();
			}
		}

		registerHandlersOpen()
		{
			this.btnClose.onclick = this.onClose;

			this.logicalIdInEl.addEventListener("change", () =>
			{
				this.discardData();

				this.logicalId = this.logicalIdInEl.value;
				this.setAttribute("logicalId", this.logicalId);
				this.titleEl.innerText = `${this.widgetName} ${this.logicalId}`
			});
		}

		registerHandlersClosed()
		{
			this.btnOpen.onclick = this.onOpen;
		}

		onOpen = () =>
		{
			this.isOpen = true;
			this.renderContent();
			this.setBasicInputData();
			this.registerHandlers();

			this.btnClose.focus();
		};

		onClose = () =>
		{
			this.saveData();

			this.isOpen = false;
			this.renderContent();
			this.registerHandlers();

			this.btnOpen.focus();
		};

		onDelete = () =>
		{
			Common.Controls.Popups.hideModal();

			this.discardData();
			this.remove();
		};

		onAbortDelete = () =>
		{
			Common.Controls.Popups.hideModal();
			this.btnDelete.focus();
		};

		saveData()
		{
			const data = {};
			this.saveBasicInputData(data);
			this.saveSubWidgets(data);
			return data;
		}

		saveSubWidgets(data)
		{
			const subWidgets = [];
			for (const swTag of ns.SAVEABLE_SUBWIDGET_TAG_NAMES)
			{
				subWidgets.push(...this.getElementsByTagName(swTag));
			}

			for (const subWidget of subWidgets)
			{
				if (subWidget.dataProperty && !subWidget.hasAttribute("dataOwner"))
				{
					data[subWidget.dataProperty] = subWidget.getData();
				}
			}
		}

		saveBasicInputData(data)
		{
			for (let inputEl of this.getAllInputUIEls())
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					switch (inputEl.type)
					{
						case "checkbox":
							data[inputEl.getAttribute("data-prop")] = inputEl.checked || false;
							break;
						default:
							data[inputEl.getAttribute("data-prop")] = inputEl.value || null;
							break;
					}
				}
			}
		}

		setBasicInputData()
		{
			for (let inputEl of this.getAllInputUIEls())
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					switch (inputEl.type)
					{
						case "checkbox":
							inputEl.checked = this.data[inputEl.getAttribute("data-prop")] || false;
							break;
						default:
							inputEl.value = this.data[inputEl.getAttribute("data-prop")] || null;
							break;
					}
				}
			}
		}

		getAllInputUIEls()
		{
			return [
				...this.getElementsByTagName("input"),
				...this.getElementsByTagName("textarea"),
				...this.getElementsByTagName("select")
			];
		};

		discardData()
		{
			throw new Error("discardData is not implemented");
		}

		pinWidget = () =>
		{
			document.getElementById(this.isPinned ? this.homeElId : this.pinnedElId).prepend(this);
			this.isPinned = !this.isPinned;
			this.btnPin.innerText = this.isPinned ? "Unpin" : "Pin";

			this.btnPin.focus();
		}
		//#endregion
	}

	/**
	 * A pinnable widget for "Area"s.
	 */
	ns.AreaEl = class AreaEl extends ns.PinnableWidget
	{
		//#region staticProperties
		static observedAttributes = [];
		static instanceCount = 0;
		static instanceMap = {};
		//#endregion

		//#region instance properties

		//#region element properties
		btnAddItem;
		btnAddNPC;
		btnAddEvent;
		btnAddStoryText;
		//#endregion
		//#endregion

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = AreaEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.World.Areas[this.instanceId] != undefined)

			AreaEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "Area";
		}

		get idKey()
		{
			return `gw-db-area-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.World.Areas[this.logicalId]
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-inernalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-inernalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"></textarea>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Items"
										addName="Item"
										linePrefix="ID "
										networkedWidget="gw-db-item"
										dataProperty="Items"
					></gw-db-string-array>
				</div>
				<div class="card-line">
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="NPCs"
										addName="NPC"
										linePrefix="ID "
										networkedWidget="gw-db-npc"
										dataProperty="NPCs"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Events On-Visit"
										addName="Event"
										linePrefix="ID "
										networkedWidget="gw-db-event"
										dataProperty="OnVisit"
					></gw-db-string-array>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Story Texts"
									addName="Story Text"
									dataProperty="StoryTexts"
									objectTag="gw-db-story-text-object"
				></gw-db-object-array>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Portals"
									addName="Portal"
									dataProperty="Portals"
									objectTag="gw-db-portal-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties
			this.btnAddItem = document.getElementById(`${this.idKey}-btnAddItem`);
			this.btnAddNPC = document.getElementById(`${this.idKey}-btnAddNPC`);
			this.btnAddEvent = document.getElementById(`${this.idKey}-btnAddEvent`);
			this.btnAddStoryText = document.getElementById(`${this.idKey}-btnAddStoryText`);
		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.World.Areas[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.World.Areas[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-area", ns.AreaEl);

	/**
	 * A pinnable widget for "Item"s.
	 */
	ns.ItemEl = class ItemEl extends ns.PinnableWidget
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

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = ItemEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.World.Items[this.instanceId] != undefined)

			ItemEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "Item";
		}

		get idKey()
		{
			return `gw-db-item-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.World.Items[this.logicalId]
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
						<label for="${this.idKey}-displayNameEl">Display Name</label>
						<input id="${this.idKey}-displayNameEl"
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
									rows="3"></textarea>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-internalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-internalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
						></textarea>
					</div>
				</div>
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-health">Health</label>
						<input	id="${this.idKey}-health"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Health"
						/>
						<label for="${this.idKey}-maxHealth">Max Health</label>
						<input	id="${this.idKey}-maxHealth"
								type="number"
								data-owner="${this.idKey}"
								data-prop="MaxHealth"
						/>
						<label for="${this.idKey}-armor">Armor</label>
						<input	id="${this.idKey}-armor"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Armor"
						/>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="On-Break"
										addName="Event"
										linePrefix="ID "
										networkedWidget="gw-db-event"
										dataProperty="OnBreak"
					></gw-db-string-array>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Actions"
									addName="Action"
									dataProperty="Actions"
									objectTag="gw-db-action-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties
			
		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.World.Items[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.World.Items[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-item", ns.ItemEl);

	/**
	 * A pinnable widget for "Event"s.
	 */
	ns.EventEl = class EventEl extends ns.PinnableWidget
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

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = EventEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.Events[this.instanceId] != undefined);

			EventEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "Event";
		}

		get idKey()
		{
			return `gw-db-event-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.World.Items[this.logicalId];
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
						<label for="${this.idKey}-occurrences">Occurrences</label>
						<input	id="${this.idKey}-occurrences"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Occurrences"
						/>
						<label for="${this.idKey}-singleton">Is Singleton?</label>
						<input	id="${this.idKey}-singleton"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="IsSingleton"
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
						<label for="${this.idKey}-internalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-internalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
						></textarea>
					</div>
				</div>
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-setLoc">Set Location</label>
						<input	id="${this.idKey}-setLoc"
								type="text"
								data-owner="${this.idKey}"
								data-prop="SetLocation"
						/>
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-setLoc">
						</gw-db-widget-link>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Remove Items"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="RemoveItems"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Get Items"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="GetItems"
					></gw-db-string-array>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Place Items"
									addName="Item Set"
									dataProperty="PlaceItems"
									objectTag="gw-db-place-items-object"
				></gw-db-object-array>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Move NPCs"
									addName="NPC Move"
									dataProperty="MoveNPC"
									objectTag="gw-db-move-npc-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.Events[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.Events[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-event", ns.EventEl);

	/**
	 * A pinnable widget for "NPC"s.
	 */
	ns.NPCEl = class NPCEl extends ns.PinnableWidget
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

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = NPCEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.NPCs[this.instanceId] != undefined);

			NPCEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "NPC";
		}

		get idKey()
		{
			return `gw-db-npc-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.NPCs[this.logicalId];
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
				</div>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.NPCs[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.NPCs[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-npc", ns.NPCEl);

	/**
	 * A pinnable widget for "Dialog"s.
	 */
	ns.DialogEl = class DialogEl extends ns.PinnableWidget
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

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = DialogEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.Dialogs[this.instanceId] != undefined);

			DialogEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "Dialog";
		}

		get idKey()
		{
			return `gw-db-dialog-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Dialogs[this.logicalId];
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
				</div>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.Dialogs[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.Dialogs[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-dialog", ns.DialogEl);

	/**
	 * A pinnable widget for "Criteria"s.
	 */
	ns.CriteriaEl = class CriteriaEl extends ns.PinnableWidget
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

		//#region Basic Implementation

		constructor()
		{
			super();

			do
			{
				this.instanceId = CriteriaEl.instanceCount++;
			} while (Pages.DungeonBuilder.Data.Criteria[this.instanceId] != undefined);

			CriteriaEl.instanceMap[this.instanceId] = this;
		}

		get widgetName()
		{
			return "Criteria";
		}

		get idKey()
		{
			return `gw-db-criteria-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Criteria[this.logicalId];
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();
			this.initialized = true;
		}
		//#endregion

		//#region Render
		renderContentClosed()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getClosedHeaderHTML()}
			</div>
			`;

			//element properties
		}

		renderContentOpen()
		{
			//Markup
			this.innerHTML = `
			<div class="card">
				${this.getOpenHeaderHTML()}
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
				</div>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
		registerHandlersOpen()
		{
			super.registerHandlersOpen();
		}

		registerHandlersClosed()
		{
			super.registerHandlersClosed();
		}

		saveData()
		{
			let data = super.saveData();

			Pages.DungeonBuilder.Data.Criteria[this.logicalId] = data;
		}

		discardData()
		{
			delete Pages.DungeonBuilder.Data.Criteria[this.logicalId];
		}
		//#endregion
	};
	customElements.define("gw-db-criteria", ns.CriteriaEl);
});