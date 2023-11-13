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

		//#region HTMLElement implementation
		connectedCallback()
		{
			if (this.initialized) { return; }

			this.logicalId = this.getAttribute("logicalId") || this.instanceId;
			this.isOpen = this.getAttribute("open") || false;
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

			this.btnPin.onclick = () =>
			{
				document.getElementById(this.isPinned ? this.homeElId : this.pinnedElId).appendChild(this);
				this.isPinned = !this.isPinned;
				this.btnPin.innerText = this.isPinned ? "Unpin" : "Pin";

				this.btnPin.focus();
			};

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
		}

		registerHandlersClosed()
		{
			this.btnOpen.onclick = this.onOpen;
		}

		onOpen = () =>
		{
			this.isOpen = true;
			this.renderContent();
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
			throw new Error("saveData is not implemented");
		}

		discardData()
		{
			throw new Error("discardData is not implemented");
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

		constructor()
		{
			super();
			this.instanceId = AreaEl.instanceCount++;
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
					<div class="input-grid">
						<label for="${this.idKey}-logicalIdInEl">ID</label>
						<input id="${this.idKey}-logicalIdInEl" type="text" value="${this.logicalId}" />
					</div>
					<fieldset>
						<legend>Items</legend>
						<div class="input-grid">
							<!--<label for="">Item 1 ID</label> KJA TODO
							<input id="" type="text" />-->
							<button id="${this.idKey}-btnAddItem" class="full-line">Add Item</button>
						</div>
					</fieldset>
				</div>
				<div class="card-line">
					<fieldset>
						<legend>NPCs</legend>
						<div class="input-grid">
							<!--<label for="">NPC 1 ID</label> KJA TODO
							<input id="" type="text" />-->
							<button id="${this.idKey}-btnAddNPC" class="full-line">Add NPC</button>
						</div>
					</fieldset>
					<fieldset>
						<legend>Events On-Visit</legend>
						<div class="input-grid">
							<!--<label for="">Event 1 ID</label> KJA TODO
							<input id="" type="text" />-->
							<button id="${this.idKey}-btnAddEvent" class="full-line">Add Event</button>
						</div>
					</fieldset>
				</div>
				<hr />
				<div class="button-header">
					<h5>Story Texts</h5>
					<button id="${this.idKey}-btnAddStoryText">New Story Text</button>
				</div>
				<!--<fieldset class="centered backgroundColorContent"> KJA TODO
					<legend>Story Text 1</legend>
					<fieldset class="maxWidth500">
						<legend>Prereqs</legend>
						<div class="input-grid">
							<label for="">Prereq 1 ID</label>
							<input id="" type="text" />
							<button class="full-line">Add Prereq</button>
						</div>
					</fieldset>
					<div class="input-vertical-line">
						<label for="">Display Text</label>
						<textarea id="" class="full-width-txa" rows="4"></textarea>
					</div>
				</fieldset>-->
				<hr />
				<div class="button-header">
					<h5>Portals</h5>
					<button id="${this.idKey}-btnAddPortal">New Portal</button>
				</div>
				<!--<fieldset class="backgroundColorContent"> KJA TODO
					<legend>Portal 1</legend>
					<div class="card-line">
						<div class="input-grid">
							<label for="">Area ID</label>
							<input id="" type="text" />
						</div>
						<div class="input-grid">
							<label for="">Description</label>
							<textarea id ="" class="full-width-txa" rows="2" cols="25"></textarea>
						</div>
					</div>
					<div class="input-vertical-line">
						<label for="">Access Text</label>
						<textarea id="" class="full-width-txa" rows="4"></textarea>
					</div>
					<div class="card-line">
						<fieldset>
							<legend>Visibility Prereqs</legend>
							<div class="input-grid">
								<label for="">Visibility Prereq 1 ID</label>
								<input id="" type="text" />
								<button class="full-line">Add Visibility Prereq</button>
							</div>
						</fieldset>
						<fieldset>
							<legend>Access Prereqs</legend>
							<div class="input-grid">
								<label for="">Access Prereq 1 ID</label>
								<input id="" type="text" />
								<button class="full-line">Add Access Prereq</button>
							</div>
						</fieldset>
					</div>
				</fieldset>-->
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
			// KJA TODO
			console.log(this.idKey + " saveData()");
		}

		discardData()
		{
			// KJA TODO
			console.log(this.idKey + " discardData()");
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

		constructor()
		{
			super();
			this.instanceId = ItemEl.instanceCount++;
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
					<div class="input-grid">
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
			// KJA TODO
			console.log(this.idKey + " saveData()");
		}

		discardData()
		{
			// KJA TODO
			console.log(this.idKey + " discardData()");
		}
		//#endregion
	};
	customElements.define("gw-db-item", ns.ItemEl);
});