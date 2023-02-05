/**
 * Plugin by Nelow/Lyn
 * 
 * Makes taking a second action after using the unit event specified
 * requires 2 custom parameters in the unit event (to access that right click the Unit event, Details, custom parameters)
 * {
 *	secondAction: true,
 *	hadCustomAction: false
 * }
 * 
 * secondAction: true means the unit gets a second action after the command, false disables this
 * hadCustomAction needs to be set to false or it wont work the first time
 */
(function() {
var NL_FreeUnitEventCommand01 = UnitCommand.UnitEvent
UnitCommand.UnitEvent._moveEvent = function () {
	var result = MoveResult.CONTINUE;
	var event = this._getEvent();
	if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
		if (!UnitEventChecker.isCancelFlag()) {
			// Cancel doesn't occur, it means that some operation is done, so end it.
			if (event.custom.secondAction === true && event.custom.hadCustomAction === false) {
				event.custom.hadCustomAction = true;
				this.setExitCommand(this);
				this.rebuildCommand();
			} else {
				event.custom.hadCustomAction = false;
				this.endCommandAction();
			}
		}
		UnitEventChecker.setCancelFlag(false);
		event.custom.hadCustomAction = false;
		return MoveResult.END;
	}


	return result;
};

var NL_FreeUnitEventCommand02 = UnitCommand.UnitEvent.isCommandDisplayable

UnitCommand.UnitEvent.isCommandDisplayable = function () {
	var value = NL_FreeUnitEventCommand02.call(this);
	var event = this._getEvent();
	if (event.custom.hadCustomAction === true) {
		return false;
	}
	return value;
};
})();