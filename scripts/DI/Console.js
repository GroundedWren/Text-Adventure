/**
 * Namespace for the console of the Dungeoneer Interace
 */
registerNamespace("DI.Console", function (ns)
{
	//#region fields
	// The console's input field
	__inputEl = null;
	// The console's input label
	__labelEL = null;
	// The console's history DOM elements
	__historyEl = null;
	__historyList = null
	//#endregion

	//#region setup
	/**
	 * Registers relevant elements with the namespace
	 * @param inputEl the input element
	 * @param labelEl the label element
	 * @param historyEl the history element
	 * @param historyList the history list
	 */
	function registerElements(inputEl, labelEl, historyEl, historyList)
	{
		inputEl.addEventListener("keydown", DI.Console.keydown);
		__inputEl = inputEl;

		__labelEl = labelEl;

		__historyEl = historyEl;
		__historyList = historyList;
	};
	ns.registerElements = registerElements;
	//#endregion

	/**
	 * Frontline keydown handler for the console's input element
	 */
	ns.keydown = (keyEv) =>
	{
		switch (keyEv.keyCode)
		{
			case Common.KeyCodes.Enter:
				if (validateInput(__inputEl.value))
				{
					processInput(__inputEl.value);
					clearInput();
				}
				break;
			case Common.KeyCodes.Tab:
				// do something!
				break;
			case Common.KeyCodes.Esc:
				clearInput();
				break;
		}
	};

	function clearInput()
	{
		__inputEl.value = "";
	}
	ns.clearInput = clearInput;

	function validateInput(inputText)
	{
		return !!inputText;
	}
	ns.validateInput = validateInput;

	function processInput(inputText)
	{
		const { el: historyItem } = Common.DOMLib.createElement("li", __historyList);
		historyItem.innerText = inputText;
		__historyEl.scrollTop = __historyEl.offsetHeight;
		if (__historyEl.scrollTop > 0 && __historyList.childElementCount > 20)
		{
			__historyList.firstChild.remove();
			__historyEl.scrollTop = __historyEl.offsetHeight;
		}
	}
	ns.processInput = processInput;
});