/**
 * Plugin by Nelow/Lyn
 * 
 * Makes taking a second action after using the Steal action possible
 * requires 2 custom parameters in the unit with the Steal action
 * {
 *	freeSteal: true,
 *	hadStealAction: false
 * }
 * 
 * freeSteal: true means the unit gets a second action after the command, false disables this
 * hadStealAction needs to be set to false or it wont work the first time
 */
(function () {
	UnitCommand.Steal._moveExp = function () {
		var result = this._dynamicEvent.moveDynamicEvent();
		if (result === MoveResult.END) {
			var unit = this.getCommandTarget();
			if (unit.custom.freeSteal === true && unit.custom.hadStealAction === false) {
				unit.custom.hadStealAction = true;
				this.setExitCommand(this);
				this.rebuildCommand();
				
			} else {
				unit.custom.hadStealAction = false;
				this.endCommandAction();
			}
		}
		return result;
	};

	var NL_FreeUnitEventCommand02 = UnitCommand.Steal.isCommandDisplayable;

	UnitCommand.Steal.isCommandDisplayable = function () {
		var value = NL_FreeUnitEventCommand02.call(this);
		var unit = this.getCommandTarget();
		if (unit.custom.hadStealAction === true) {
			return false;
		}
		return value;
	}

	var NL_FreeUnitEventCommand03 = MapSequenceCommand._doLastAction;

	MapSequenceCommand._doLastAction = function () {
		var result = NL_FreeUnitEventCommand03.call(this);
		var unit = this._targetUnit;
		var count = unit.getUnitEventCount();
		if (result !== 2) {
			for (i = 0; i < count; i++) {
				if (unit.custom.hadStealAction === true) {
					unit.custom.hadStealAction = false;
				}
			}
		}

		return result;
	}
})();
