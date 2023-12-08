registerNamespace("Pages.DungeonBuilder.Controls", function (ns)
{
	ns.getDecorativeIcon = function getDecorativeIcon(key)
	{
		return `<gw-icon iconKey="${key}" aria-hidden="true"></gw-icon>`;
	};

	ns.SaveableWidget = class SaveableWidget extends HTMLElement
	{
		//#region staticProperties
		static observedAttributes = [];
		//#endregion

		//#region instance properties
		initialized;
		instanceId;
		logicalId;

		//#region element properties

		//#endregion
		//#endregion

		constructor()
		{
			super();
			this.initialized = false;
		}

		get idKey()
		{
			throw new Error("get idKey is not implemented");
		}

		get data()
		{
			throw new Error("get data is not implemented");
		}
		set data(value)
		{
			throw new Error("set data is not implemented");
		}
		discardData()
		{
			throw new Error("discardData is not implemented");
		}
		get dataPath()
		{
			throw new Error("get dataPath is not implemented");
		}

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

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

		registerHandlers()
		{
			throw new Error("registerHandlers is not implemented");
		}

		saveData()
		{
			this.data = this.getSaveData();
		}

		getSaveData()
		{
			const data = {};
			ns.getBasicInputData(data, this);
			ns.getSubWidgetData(data, this);
			return data;
		}

		ownsSubWidget = (subWidget) =>
		{
			throw new Error("ownsSubWidget is not implemented");
		};

		setBasicInputData()
		{
			for (let inputEl of ns.getAllInputUIEls(this))
			{
				if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === this.idKey)
				{
					switch (inputEl.type)
					{
						case "checkbox":
							inputEl.checked = this.data[inputEl.getAttribute("data-prop")] || false;
							break;
						case "select-one":
							inputEl.value = this.data[inputEl.getAttribute("data-prop")]
								|| inputEl.firstElementChild.innerText;
							break;
						default:
							inputEl.value = this.data[inputEl.getAttribute("data-prop")] || null;
							break;
					}
					inputEl.dispatchEvent(new Event("change", { "bubbles": true }));
				}
			}
		}
	}

	ns.CharacterWidgetEl = class CharacterWidgetEl extends ns.SaveableWidget
	{
		get idKey()
		{
			return "character";
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Character;
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.Character = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.Character;
		}
		get dataPath()
		{
			return "Data.Character";
		}

		connectedCallback()
		{
			if (this.initialized) { return; }

			super.connectedCallback();

			this.setBasicInputData();

			this.initialized = true;
		}

		ownsSubWidget = (subWidget) =>
		{
			return !subWidget.hasAttribute("dataOwner") || subWidget.getAttribute("dataOwner") === this.idKey;
		};

		renderContent()
		{
			this.innerHTML = `
			<div class="character-content">
				<div class="card-line">
					<div class="input-grid widget-grid-input widget-align-start">
						<label for="${this.idKey}-name">Name</label>
						<input id="${this.idKey}-name"
								type="text"
								data-owner="${this.idKey}"
								data-prop="Name"
								data-helptext="The display name of the player"
						/>
						<label for="${this.idKey}-levelEl">Level</label>
						<input id="${this.idKey}-levelEl"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Level"
								data-helptext="The level the player has achieved"
						/>
						<label for="${this.idKey}-xpEl">Experience</label>
						<input id="${this.idKey}-xpEl"
								type="number"
								data-owner="${this.idKey}"
								data-prop="XP"
								data-helptext="The experience points the player has earned"
						/>
					</div>
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-loc">Location</label>
							<input	id="${this.idKey}-loc"
									type="text"
									data-owner="${this.idKey}"
									data-prop="Location"
									data-helptext="The area where the player is"
							/>
							<gw-db-widget-link
								id=${this.idKey}-linkBtn
								networkedWidget="gw-db-area" 
								idInputElId="${this.idKey}-loc">
							</gw-db-widget-link>
							<label for="${this.idKey}-moneyEl">Money</label>
							<input id="${this.idKey}-moneyEl"
									type="number"
									data-owner="${this.idKey}"
									data-prop="Money"
									data-helptext="How much money the player has"
							/>
							<div></div>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Party"
										addName="NPC"
										linePrefix="ID "
										networkedWidget="gw-db-npc"
										dataProperty="Party"
										data-helptext="The NPCs in the player's party"
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
										data-helptext="A physical description of the player"
							></textarea>
						</div>
					</div>
				<div class="card-line centered">
					<gw-db-pronouns id="character-pronouns"
									parentWidgetId="${this.id}"
									dataProperty="Pronouns"
					></gw-db-pronouns>
				</div>
				<div class="card-line centered">
					<gw-db-vitals id="character-vitals"
									parentWidgetId="${this.id}"
									dataProperty="Vitals"
					></gw-db-vitals>
				</div>
				<div class="card-line centered">
					<gw-db-abilities id="character-abilities"
										parentWidgetId="${this.id}"
										dataProperty="Abilities"
					></gw-db-abilities>
				</div>
				<div class="card-line centered">
					<gw-db-skills id="character-skills"
									parentWidgetId="${this.id}"
									dataProperty="Skills"
					></gw-db-skills>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Inventory"
									addName="Item"
									dataProperty="Inventory"
									iconKey="box-open"
									objectTag="gw-db-player-inven-object"
				></gw-db-object-array>
			</div>
			`;
		}

		registerHandlers()
		{
		}
	}
	customElements.define("gw-db-character", ns.CharacterWidgetEl);
	
	/**
	 * A base class for all pinnable widgets in the builder
	 */
	ns.PinnableWidget = class PinnableWidget extends ns.SaveableWidget
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

		//#region Basic Implementation
		constructor()
		{
			super();
		}

		get widgetName()
		{
			throw new Error("get widgetName is not implemented");
		}
		get widgetIcon()
		{
			throw new Error("get widgetIcon is not implemented");
		}
		//#endregion

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

			super.connectedCallback();
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

			this.btnDelete?.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["trash"], "delete"));
			this.btnOpen?.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["pen-to-square"], "open"));
			this.btnClose?.appendChild(Common.SVGLib.createIcon(Common.SVGLib.Icons["book"], "close"));
			this.#setPinIcon();
		}

		#setPinIcon()
		{
			this.btnPin.innerHTML = "";
			this.btnPin?.appendChild(Common.SVGLib.createIcon(
				Common.SVGLib.Icons["thumbtack"],
				this.isPinned ? "Unpin" : "Pin"
			));
		}

		renderContentClosed()
		{
			throw new Error("renderContentClosed is not implemented");
		}

		getClosedHeaderHTML()
		{
			return this.#getHeaderHTML(
				`<button id="${this.idKey}-btnOpen" aria-describedby="${this.idKey}-title"></button>`
			);
		}

		getOpenHeaderHTML()
		{
			return this.#getHeaderHTML(
				`<button id="${this.idKey}-btnClose" aria-describedby="${this.idKey}-title"></button>`
			);
		}

		#getHeaderHTML(closeOpenEl)
		{
			return `
			<div class="card-header">
				<span id="${this.idKey}-title" role="heading" aria-level="4">${this.getTitleHTML()}</span>
				<div class="card-header-btns">
					<button id="${this.idKey}-btnDelete" aria-describedby="${this.idKey}-title"></button>
					${closeOpenEl}
					<button id="${this.idKey}-btnPin" aria-describedby="${this.idKey}-title"></button>
				</div>
			</div>
			`;
		}

		getTitleHTML()
		{
			return `${this.widgetIcon} ${this.widgetName} ${this.logicalId}`;
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

			this.addEventListener("gw-open-widget", this.onOpen);
			this.addEventListener("gw-close-widget", this.onClose);
			this.addEventListener("gw-pin-widget", (event) =>
			{
				event.stopImmediatePropagation();
				this.pinWidget();
			});
			this.addEventListener("gw-next-widget", () =>
			{
				if (this.nextElementSibling?.widgetName)
				{
					this.nextElementSibling.btnOpen?.focus();
					this.nextElementSibling.btnClose?.focus();
				}
			});
			this.addEventListener("gw-prev-widget", () =>
			{
				if (this.previousElementSibling?.widgetName)
				{
					this.previousElementSibling.btnOpen?.focus();
					this.previousElementSibling.btnClose?.focus();
				}
			});
		}

		registerHandlersOpen()
		{
			this.btnClose.onclick = this.onClose;

			this.logicalIdInEl.addEventListener("change", () =>
			{
				this.discardData();

				this.logicalId = this.logicalIdInEl.value;
				this.setAttribute("logicalId", this.logicalId);
				this.titleEl.innerHTML = this.getTitleHTML();
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

		ownsSubWidget = (subWidget) =>
		{
			return !subWidget.hasAttribute("dataOwner") || subWidget.getAttribute("dataOwner") === this.idKey;
		};

		pinWidget = () =>
		{
			document.getElementById(this.isPinned ? this.homeElId : this.pinnedElId).prepend(this);
			this.isPinned = !this.isPinned;
			this.#setPinIcon();

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
		static iconKey = "location-dot";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(AreaEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-area-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.World.Areas[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.World.Areas[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.World.Areas[this.logicalId];
		}
		get dataPath()
		{
			return `Data.World.Areas[${this.logicalId}]`
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
								data-helptext="The name with which the player will see and interact with this area"
						/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-inernalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-inernalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this area not used in game logic"
						></textarea>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Items"
										addName="Item"
										linePrefix="ID "
										networkedWidget="gw-db-item"
										dataProperty="Items"
										data-helptext="The items in the area"
					></gw-db-string-array>
				</div>
				<div class="card-line">
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="NPCs"
										addName="NPC"
										linePrefix="ID "
										networkedWidget="gw-db-npc"
										dataProperty="NPCs"
										data-helptext="The NPCs in the area"
					></gw-db-string-array>
					<div class="input-vertical-line">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									rows="3"
									data-helptext="Text the player will see when they look around the area"
						></textarea>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Events On-Visit"
										addName="Event"
										linePrefix="ID "
										networkedWidget="gw-db-event"
										dataProperty="OnVisit"
										data-helptext="Events triggered by the player entering this area"
					></gw-db-string-array>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Story Texts"
									addName="Story Text"
									dataProperty="StoryTexts"
									iconKey="scroll"
									objectTag="gw-db-story-text-object"
				></gw-db-object-array>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Portals"
									addName="Portal"
									dataProperty="Portals"
									iconKey="door-open"
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
		static iconKey = "box-open";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(ItemEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-item-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.World.Items[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.World.Items[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.World.Items[this.logicalId];
		}
		get dataPath()
		{
			return `Data.World.Items[${this.logicalId}]`;
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
				<div class="card-line center-align">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
						<label for="${this.idKey}-displayNameEl">Display Name</label>
						<input id="${this.idKey}-displayNameEl"
								type="text"
								data-owner="${this.idKey}"
								data-prop="DisplayName"
								data-helptext="The name with which the player will see and interact with this item"
						/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-internalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-internalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this item not used in game logic"
						></textarea>
					</div>
					<div class="placeholder"></div>
				</div>
				<div class="card-line centered">
					<div class="input-block">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									class="full-width"
									rows="4"
									data-helptext="Text the player will see when they look at the item"
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
								data-helptext="If this item can be damaged, this is its remaining health"
						/>
						<label for="${this.idKey}-maxHealth">Max Health</label>
						<input	id="${this.idKey}-maxHealth"
								type="number"
								data-owner="${this.idKey}"
								data-prop="MaxHealth"
								data-helptext="If the item can be damaged, this is its maximum health"
						/>
					</div>
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-armor">Armor Bonus</label>
						<input	id="${this.idKey}-armor"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Armor"
								data-helptext="If the item can be worn, it will convey this armor bonus to the player"
						/>
						<label for="${this.idKey}-evasion">Evasion Bonus</label>
						<input	id="${this.idKey}-evasion"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Evasion"
								data-helptext="If this item can be worn, it will convey this evasion modifier to the player"
						/>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="On-Break"
										addName="Event"
										linePrefix="ID "
										networkedWidget="gw-db-event"
										dataProperty="OnBreak"
										data-helptext="Events triggered when this item's health falls to zero"
					></gw-db-string-array>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Actions"
									addName="Action"
									dataProperty="Actions"
									iconKey="star"
									objectTag="gw-db-action-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties
			
		}
		//#endregion

		//#region Handlers
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
		static iconKey = "calendar";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(EventEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-event-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Events[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.Events[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.Events[this.logicalId];
		}
		get dataPath()
		{
			return `Data.Events[${this.logicalId}]`;
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
								data-helptext="The number of times this event has been triggered"
						/>
						<label for="${this.idKey}-singleton">Is Singleton?</label>
						<input	id="${this.idKey}-singleton"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="IsSingleton"
								data-helptext="Whether this event can only occur once"
						/>
						<label for="${this.idKey}-mooe">Mark Occurred On Eval?</label>
						<input	id="${this.idKey}-mooe"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="AlwaysMarkOccurred"
								data-helptext="Whether this events occurrences will increment even if the corequisites fail <br />(nothing else about the event will be triggered)"
						/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-internalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-internalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this event not used in game logic"
						></textarea>
					</div>
					<div class="placeholder"></div>
				</div>
				<div class="card-line center-align">
					<gw-db-condition-array parentWidgetId="${this.id}"
										displayName="Corequisites"
										addName="Coreq"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
										dataProperty="Coreqs"
										ownerIdKey="${this.idKey}"
										data-helptext="Criteria to evaluate to determine if this event will truly occur"
					></gw-db-condition-array>
					<div class="input-vertical-line">
						<label for="${this.idKey}-coreqFailtext">Text on Fail Coreqs</label>
						<textarea	id="${this.idKey}-coreqFailtext"
									data-owner="${this.idKey}"
									data-prop="CoreqFailText"
									rows="3"
									data-helptext="Text displayed if the corequisites do not pass"
						></textarea>
					</div>
					<div class="placeholder"></div>
				</div>
				<div class="card-line centered">
					<div class="input-block">
						<label for="${this.idKey}-description">Description</label>
						<textarea	id="${this.idKey}-description"
									data-owner="${this.idKey}"
									data-prop="Description"
									class="full-width"
									rows="4"
									data-helptext="Text displayed when the event occurs"
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
								data-helptext="The player will be moved to this area after the event occurs"
						/>
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-setLoc">
						</gw-db-widget-link>
						<label for="${this.idKey}-talkNPC">Trigger Dialog With</label>
						<input	id="${this.idKey}-talkNPC"
								type="text"
								data-owner="${this.idKey}"
								data-prop="TriggerDialogWith"
								data-helptext="A dialog with this NPC will start after the event"
						/>
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-npc" 
							idInputElId="${this.idKey}-talkNPC">
						</gw-db-widget-link>
						<label for="${this.idKey}-moneyEl">Adjust Money</label>
						<input id="${this.idKey}-moneyEl"
								type="number"
								data-owner="${this.idKey}"
								data-prop="AdjustMoney"
								data-helptext="The player will gain or lose this amount of money"
						/>
						<div></div>
						<label for="${this.idKey}-addXP">Add XP</label>
						<input id="${this.idKey}-addXP"
								type="number"
								data-owner="${this.idKey}"
								data-prop="AddXP"
								data-helptext="The player will gain this amount of experience points"
						/>
						<div></div>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Remove Items"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="RemoveItems"
										data-helptext="These items will be removed from the player's inventory if the player has them"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Get Items"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="GetItems"
										data-helptext="These items will be placed in the player's inventory"
					></gw-db-string-array>
				</div>
				<div class="card-line">
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Trigger Events"
										addName="Event"
										linePrefix="Event ID "
										networkedWidget="gw-db-event"
										dataProperty="TriggerEvents"
										data-helptext="Other events which can chain off of this event occurring<br />Beware, there is no cycle protection"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Mark NPCs Hostile"
										addName="NPC"
										linePrefix="NPC ID "
										networkedWidget="gw-db-npc"
										dataProperty="MarkNPCsHostile"
										data-helptext="These NPCs will become hostile to the player"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Mark NPCs Not Hostile"
										addName="NPC"
										linePrefix="NPC ID "
										networkedWidget="gw-db-npc"
										dataProperty="MarkNPCsNotHostile"
										data-helptext="These NPCs will cease being hostile towards the player"
					></gw-db-string-array>
				</div>
				<div class="card-line">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-hasattack">Has Attack?</label>
							<input	id="${this.idKey}-hasattack"
									type="checkbox"
									aria-controls="${this.idKey}-attack"
									data-owner="${this.idKey}"
									data-prop="HasAttack"
									data-helptext="Whether this event triggers an attack on specified valid targit types in the player's area"
							/>
					</div>
					<gw-db-attack	id="${this.idKey}-attack"
									class="hidden"
									dataOwner="${this.idKey}"
									dataProperty="Attack">
					</gw-db-attack>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Place Items"
									addName="Item Set"
									dataProperty="PlaceItems"
									iconKey="boxes-stacked"
									objectTag="gw-db-place-items-object"
				></gw-db-object-array>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Move NPCs"
									addName="NPC Move"
									dataProperty="MoveNPC"
									iconKey="person-running"
									objectTag="gw-db-move-npc-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties
			this.hasAttackCbx = document.getElementById(`${this.idKey}-hasattack`);
			this.attackEl = document.getElementById(`${this.idKey}-attack`);
		}

		renderData(data)
		{
			super.renderData(data);
			this.onHasAttackSet();
		}
		//#endregion

		//#region Handlers
		registerHandlers()
		{
			super.registerHandlers();

			this.hasAttackCbx?.addEventListener("change", this.onHasAttackSet);
		}

		onHasAttackSet = () =>
		{
			if (this.hasAttackCbx.checked)
			{
				this.attackEl.classList.remove("hidden");
			}
			else
			{
				this.attackEl.classList.add("hidden");
			}
		};
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
		static iconKey = "people-group";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(NPCEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-npc-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.NPCs[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.NPCs[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.NPCs[this.logicalId];
		}
		get dataPath()
		{
			return `Data.NPCs[${this.logicalId}]`;
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
								data-helptext="The name with which the player will interact with this NPC"
						/>
						<label for="${this.idKey}-levelEl">Level</label>
						<input id="${this.idKey}-levelEl"
								type="number"
								data-owner="${this.idKey}"
								data-prop="Level"
								data-helptext="The NPC's level for game mechanics"
						/>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-InternalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-InternalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this NPC not used in game logic"
						></textarea>
					</div>
					<div class="placeholder"></div>
				</div>
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-location">Location</label>
						<input	id="${this.idKey}-location"
								type="text"
								data-owner="${this.idKey}"
								data-prop="Location"
								data-helptext="The current location of the NPC"
						/>
						<gw-db-widget-link
							id=${this.idKey}-linkBtn
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-location">
						</gw-db-widget-link>
						<label for="${this.idKey}-hostile">Is Hostile?</label>
						<input	id="${this.idKey}-hostile"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="IsHostile"
								data-helptext="Whether the NPC is hostile towards the player"
						/>
						<div class="placeholder"></div>
					</div>
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-moneyEl">Money</label>
							<input id="${this.idKey}-moneyEl"
									type="number"
									data-owner="${this.idKey}"
									data-prop="Money"
									data-helptext="How much money the NPC has"
							/>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Inventory"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="Inventory"
										data-helptext="What the NPC has in their inventory"
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
									data-helptext="Text the player will see if they look at the NPC"
						></textarea>
					</div>
				</div>
				<div class="card-line centered">
					<gw-db-pronouns	id="${this.idKey}-pronouns"
									parentWidgetId="${this.id}"
									dataProperty="Pronouns"
					></gw-db-pronouns>
				</div>
				<div class="card-line centered">
					<gw-db-vitals	id="${this.idKey}-vitals"
									parentWidgetId="${this.id}"
									dataProperty="Vitals"
					></gw-db-vitals>
				</div>
				<div class="card-line centered">
					<gw-db-abilities	id="${this.idKey}-abilities"
										parentWidgetId="${this.id}"
										dataProperty="Abilities"
					></gw-db-abilities>
				</div>
				<div class="card-line centered">
					<gw-db-skills	id="${this.idKey}-skills"
									parentWidgetId="${this.id}"
									dataProperty="Skills"
					></gw-db-skills>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Salutations"
									addName="Salutation"
									dataProperty="Salutations"
									iconKey="handshake"
									objectTag="gw-db-salutation-object"
				></gw-db-object-array>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Dialog Trees"
									addName="Tree"
									dataProperty="DialogTrees"
									iconKey="comments"
									objectTag="gw-db-dialog-tree-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
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
		static iconKey = "comments";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(DialogEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-dialog-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Dialogs[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.Dialogs[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.Dialogs[this.logicalId];
		}
		get dataPath()
		{
			return `Data.Dialogs[${this.logicalId}]`;
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
				<div class="card-line center-align">
					<div class="input-grid widget-grid-input">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-internalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-internalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this dialog not used in game logic"
						></textarea>
					</div>
					<div class="placeholder"></div>
				</div>
				<div class="card-line centered">
					<div class="input-block">
						<label for="${this.idKey}-text">Text</label>
						<textarea	id="${this.idKey}-text"
									data-owner="${this.idKey}"
									data-prop="Text"
									class="full-width"
									rows="4"
									data-helptext="Text displayed to the player when this dialog node is reached"
						></textarea>
					</div>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Responses"
									addName="Response"
									dataProperty="Responses"
									iconKey="reply"
									objectTag="gw-db-dialog-response-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties

		}
		//#endregion

		//#region Handlers
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
		static iconKey = "clipboard-check";
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
		get widgetIcon()
		{
			return ns.getDecorativeIcon(CriteriaEl.iconKey);
		}

		get idKey()
		{
			return `gw-db-criteria-${this.instanceId}`;
		}

		get data()
		{
			return Pages.DungeonBuilder.Data.Criteria[this.logicalId] || {};
		}
		set data(value)
		{
			Pages.DungeonBuilder.Data.Criteria[this.logicalId] = value;
		}
		discardData()
		{
			delete Pages.DungeonBuilder.Data.Criteria[this.logicalId];
		}
		get dataPath()
		{
			return `Data.Criteria[${this.logicalId}]`;
		}

		//#endregion

		//#region HTMLElement implementation
		connectedCallback()
		{
			super.connectedCallback();

			if (this.initialized) { return; }

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
					<div class="input-grid widget-grid-input widget-align-start">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
						<label for="${this.idKey}-negate">Negate Result?</label>
						<input	id="${this.idKey}-negate"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="NegateResult"
								data-helptext="Whether to negate the result of all other evaluation"
						/>
						<label for="${this.idKey}-allowNPC">Allow NPC Eval?</label>
						<input	id="${this.idKey}-allowNPC"
								type="checkbox"
								data-owner="${this.idKey}"
								data-prop="AllowNPC"
								data-helptext="Whether these criteria can be passed by an NPC"
						/>
					</div>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="Or Criteria"
										addName="Criteria"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
										dataProperty="OR"
										data-helptext="Other criteria records which can pass in place of this record's other evaluations"
					></gw-db-string-array>
					<gw-db-string-array parentWidgetId="${this.id}"
										displayName="And Criteria"
										addName="Criteria"
										linePrefix="Criteria ID "
										networkedWidget="gw-db-criteria"
										dataProperty="AND"
										data-helptext="Other criteria records which must also pass for this criteria record to pass"
					></gw-db-string-array>
				</div>
				<div class="card-line">
					<gw-db-condition-array parentWidgetId="${this.id}"
										displayName="NPCs in Party"
										addName="NPC"
										linePrefix="NPC ID "
										networkedWidget="gw-db-npc"
										dataProperty="NPCsInParty"
										ownerIdKey="${this.idKey}"
										data-helptext="Whether the player has these NPCs in their party"
					></gw-db-condition-array>
					<gw-db-condition-array parentWidgetId="${this.id}"
										displayName="Events Occurred"
										addName="Event"
										linePrefix="Event ID "
										networkedWidget="gw-db-event"
										dataProperty="EventsOccurred"
										ownerIdKey="${this.idKey}"
										data-helptext="Whether these events have at least one occurrence"
					></gw-db-condition-array>
					<gw-db-condition-array parentWidgetId="${this.id}"
										displayName="Has Items"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="HasItems"
										ownerIdKey="${this.idKey}"
										data-helptext="Whether the player has these items"
					></gw-db-condition-array>
				</div>
				<div class="card-line">
					<div class="input-grid id-single widget-grid-input">
						<label for="${this.idKey}-inArea">In Area</label>
						<input	id="${this.idKey}-inArea"
								type="text"
								data-owner="${this.idKey}"
								data-prop="InArea"
								data-helptext="Whether hte player is in the specified area"
						/>
						<gw-db-widget-link
							id=${this.idKey}-inArea
							networkedWidget="gw-db-area" 
							idInputElId="${this.idKey}-inArea">
						</gw-db-widget-link>
						<label for="${this.idKey}-leveledTo">Is Leveled To</label>
						<input id="${this.idKey}-leveledTo"
								type="number"
								data-owner="${this.idKey}"
								data-prop="LeveledTo"
								data-helptext="Whether the player is at least at this level"
						/>
						<div class="placeholder"></div>
						<label for="${this.idKey}-moneyEl">Has Money</label>
						<input id="${this.idKey}-moneyEl"
								type="number"
								data-owner="${this.idKey}"
								data-prop="HasMoney"
								data-helptext="Whether the player has at least this amount of money"
						/>
						<div class="placeholder"></div>
					</div>
					<div class="input-vertical-line">
						<label for="${this.idKey}-inernalNotes">Internal Notes</label>
						<textarea	id="${this.idKey}-inernalNotes"
									data-owner="${this.idKey}"
									data-prop="InternalNotes"
									rows="3"
									data-helptext="Notes about this criteria not used in game logic"
						></textarea>
					</div>
					<gw-db-condition-array parentWidgetId="${this.id}"
										displayName="Items by Player"
										addName="Item"
										linePrefix="Item ID "
										networkedWidget="gw-db-item"
										dataProperty="ItemsByPlayer"
										ownerIdKey="${this.idKey}"
										data-helptext="Whether these items are in the same area as the player"
					></gw-db-condition-array>
				</div>
				<div class="card-line centered">
					<div class="input-vertical-line">
						<label for="${this.idKey}-scop">Skill Checks Operator</label>
						<select id="${this.idKey}-scop"
								type="number"
								data-owner=${this.idKey}
								data-prop="SkillChecksOperator"
								data-helptext="How to combine the results of the listed skill checks"
						>
							<option>OR</option>
							<option>AND</option>
						</select>
					</div>
				</div>
				<gw-db-object-array parentWidgetId="${this.id}"
									displayName="Skill Checks"
									addName="Skill Check"
									dataProperty="SkillChecks"
									iconKey="d20"
									objectTag="gw-db-skill-check-object"
				></gw-db-object-array>
			</div>
			`;

			//element properties
		}
		//#endregion

		//#region Handlers
		//#endregion
	};
	customElements.define("gw-db-criteria", ns.CriteriaEl);

	//#region Helpers
	ns.getBasicInputData = function getBasicInputData(data, owner)
	{
		for (let inputEl of ns.getAllInputUIEls(owner))
		{
			if (inputEl.hasAttribute("data-prop") && inputEl.getAttribute("data-owner") === owner.idKey)
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
		return data;
	}

	ns.getSubWidgetData = function getSubWidgetData(data, owner)
	{
		const subWidgets = [];
		for (const swTag of ns.SAVEABLE_SUBWIDGET_TAG_NAMES)
		{
			subWidgets.push(...owner.getElementsByTagName(swTag));
		}

		for (const subWidget of subWidgets)
		{
			if (subWidget.dataProperty && owner.ownsSubWidget(subWidget))
			{
				data[subWidget.dataProperty] = subWidget.getData();
			}
		}
		return data;
	}

	ns.getAllInputUIEls = function (owner)
	{
		owner = owner || document;
		return [
			...owner.getElementsByTagName("input"),
			...owner.getElementsByTagName("textarea"),
			...owner.getElementsByTagName("select")
		];
	}
	//#endregion

	ns.KEY_CLASS_MAP = {
		"gw-db-area": ns.AreaEl,
		"gw-db-item": ns.ItemEl,
		"gw-db-event": ns.EventEl,
		"gw-db-npc": ns.NPCEl,
		"gw-db-dialog": ns.DialogEl,
		"gw-db-criteria": ns.CriteriaEl,
	};
});