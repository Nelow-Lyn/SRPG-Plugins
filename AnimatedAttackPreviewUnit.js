/**
 * Plugin to animate the CharChip in the BattlePreview Window
 * Plug and Play
 * 
 * 
 * Plugin made by Nelow/Lyn
 * */

(function () {
	PosAttackWindow._unitCounter = null;

	PosAttackWindow.initialize = function () {

		PosBaseWindow.initialize.call(this);
		this._unitCounter = createObject(UnitCounter);
	}

	PosAttackWindow.drawUnit = function (x, y) {
		var unit = this._unit;
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		this._unitCounter.moveUnitCounter();

		if (unit !== null) {
			unitRenderParam.direction = DirectionType.COUNT;
			unitRenderParam.animationIndex = this._unitCounter.getAnimationIndexFromUnit(unit);
			y += 20;
			UnitRenderer.drawDefaultUnit(unit, x, y, unitRenderParam);
		}
	}
}) ();