/**
 * Funny little script I made just to see if its possible
 * This Script allows you to assign a unit a second unit which
 * will then follow the first unit
 * The intention of this was to display a capture or rescue better
 * on Screen since I disliked how the unit just gets absorbed.
 * This sadly only works for the Player so far, might update it
 * to work in events/Enemy turn aswell, since that was the 
 * original goal.
 * 
 * To enable this give the unit you want another unit to follow
 * the custom parameter:
 * {moveUnitId: number}
 * where number is the Id of the unit you want to follow the first unit.
 * 
 * This Plugin provides a setter method which can be used in an 
 * execute script event to set that value to a given unit id.
 * An example of how this could be used is:
 * 
 * Make a Unit event command, for example Capture
 * make an Event Command which extracts the Map Pos.
 * Save the Unit ID in an Variable.
 * Then make an execute script command with the following code:
 * 
 * var unit = root.getCurrentSession().getActiveEventUnit();
 * var variableTable = root.getMetaSession().getVariableTable(0);
 * MoveSecondUnit.setCustomParam(unit, variableTable.getVariable(0));
 * 
 * for this example the Unit id was saved in the first table, in the first
 * variable.
 * 
 * The 0 of getVariableTable(0) means the table id. The unit ID was saved
 * in the first table, but the ID of the table starts at 0 so we get the table
 * with the ID 0.
 * 
 * The same applies to the 0 of variableTable.getVariable(0)
 * Since we saved the Unit ID in the first variable, and these
 * also start at 0, we get the Variable saved at 0 and call the
 * setter method to set the custom parameter. 
 * 
 * To unset it, you can set the custom parameter to null.
 * 
 * Made by Nelow/Lyn
 * 
 **/

var MoveSecondUnit = {

	setCustomParam: function (unit, targetUnitId) {
		unit.custom.moveUnitId = targetUnitId;
    }
}
PlayerTurn._saveSecondUnit = function (unit) {
	this._secondUnit = unit;
	this._secondUnitX = unit.getMapX();
	this._secondUnitY = unit.getMapY();
}
PlayerTurn._secondUnit = null;

NL_MoveSecondUnit01 = MapSequenceArea._prepareSequenceMemberData;
MapSequenceArea._prepareSequenceMemberData = function (parentTurnObject) {
    NL_MoveSecondUnit01.call(this, parentTurnObject);
	this._simulateMove2 = createObject(SimulateMove);
	this._targetUnit2 = this._getSecondUnit();
	this._unitRangePanel2 = MapLayer.getUnitRangePanel();
};

NL_MoveSecondUnit02 = MapSequenceArea._completeSequenceMemberData;
MapSequenceArea._completeSequenceMemberData = function (parentTurnObject) {
	NL_MoveSecondUnit02.call(this, parentTurnObject);
	if (parentTurnObject.isRepeatMoveMode() && this._targetUnit2 !== null) {
		this._targetUnit2.setDirection(this._getDefaultDirection());
		parentTurnObject._saveSecondUnit(this._targetUnit2);
	}
	else if (this._targetUnit2 !== null) {
		this._targetUnit2.setDirection(this._getDefaultDirection());
		parentTurnObject._saveSecondUnit(this._targetUnit2);
	}
};

MapSequenceArea._startMove = function () {
	var cource, cource2;
	var x = this._mapCursor.getX();
	var y = this._mapCursor.getY();
	var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;
	var dir = this._calculateSecondCoordinates();

	this._parentTurnObject.setCursorSave(this._targetUnit);
	// If select the unit current position, no need to move.
	if (isCurrentPos) {
		this._simulateMove.noMove(this._targetUnit);
		this._playMapUnitSelectSound();
		return true;
	}
	else {
		// Create a course and start moving.
		cource = this._simulateMove.createCource(this._targetUnit, x, y, this._unitRangePanel.getSimulator());
		this._simulateMove.startMove(this._targetUnit, cource);
		if (dir < 4) {
			cource2 = this._createSecondCource(dir, cource);
			this._simulateMove2.startMove(this._targetUnit2, cource2);
        }
	}
	return false;
};

MapSequenceArea._drawMoving = function () {
	this._simulateMove.drawUnit();
	if (this._targetUnit2 !== null) {
		this._simulateMove2.drawUnit();
    }
}


MapSequenceArea._moveMoving = function () {
	var result = MapSequenceAreaResult.NONE;

	if (this._targetUnit2 !== null) {
		if (this._simulateMove2.moveUnit() !== MoveResult.CONTINUE) {
			result = MapSequenceAreaResult.COMPLETE;
		}
		if (this._simulateMove.moveUnit() !== MoveResult.CONTINUE) {
			result = MapSequenceAreaResult.COMPLETE;
		}
	} else if (this._simulateMove.moveUnit() !== MoveResult.CONTINUE) {
		result = MapSequenceAreaResult.COMPLETE;
	}

	return result;
};

NL_MoveSecondUnit03 = MapSequenceCommand._doLastAction;
MapSequenceCommand._doLastAction = function () {
	var result = NL_MoveSecondUnit03.call(this);
	if (result === 2 && this._parentTurnObject._secondUnit !== null) {
		this._parentTurnObject._secondUnit.setMapX(this._parentTurnObject._secondUnitX);
		this._parentTurnObject._secondUnit.setMapY(this._parentTurnObject._secondUnitY);
		this._parentTurnObject._secondUnit.setDirection(DirectionType.NULL);
		this._parentTurnObject._secondUnit = null;
		this._parentTurnObject._secondUnitX = null;
		this._parentTurnObject._secondUnitY = null;
	}
	else if ((result === 0 || result === 1) && this._parentTurnObject._secondUnit !== null) {
		this._parentTurnObject._secondUnit.setWait(true);
    }
	return result;

}

NL_MoveSecondUnit04 = MapSequenceArea._doCancelAction;
MapSequenceArea._doCancelAction = function () {
	NL_MoveSecondUnit04.call(this);
	if (this._targetUnit2 !== null) {
		this._targetUnit2.setDirection(DirectionType.NULL);
    }
}


MapSequenceArea._createSecondCource = function (dir, cource) {
	var newCource = [];
	var count = cource.length;
	var i;

	newCource[0] = dir;
	for (i = 1; i < count; i++) {
		newCource[i] = cource[i - 1];
	}
	return newCource;
};

MapSequenceArea._getSecondUnit = function () {
	var i, unit, targetid;
	var list = TurnControl.getActorList();
	var count = list.getCount();
	targetid = this._targetUnit.custom.moveUnitId;

	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		if (unit.getId() === targetid) {
			return unit;
		}
	}
	return null;
};

MapSequenceArea._calculateSecondCoordinates = function () {
	var dir;
	var x, y, targetX, targetY;
	if (this._targetUnit2 === null) {
		return DirectionType.NULL;
	}
	x = this._targetUnit2.getMapX();
	y = this._targetUnit2.getMapY();
	targetX = this._targetUnit.getMapX();
	targetY = this._targetUnit.getMapY();
	var absX = Math.abs(x - targetX);
	var absY = Math.abs(y - targetY);

	if (absY >= absX) {
		if (y > targetY) {
			dir = DirectionType.TOP;
		}
		else {
			dir = DirectionType.BOTTOM;
		}
	}
	else {
		if (x > targetX) {
			dir = DirectionType.LEFT;
		}
		else {
			dir = DirectionType.RIGHT;
		}
	}

	return dir;
}
