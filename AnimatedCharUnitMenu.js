/*
Plugin by Nelow/Lyn
Changes the drawing of the Class Sprite to be animated in the Unit window
Overwrites UnitMenuTopWindow._drawUnitClass
*/
(function() {
UnitMenuTopWindow._unitCounter = null;

UnitMenuTopWindow.setUnitMenuData = function () {
    this._unitCounter = createObject(UnitCounter);
};

var NL_AnimatedCharUnitMenu01 = UnitMenuTopWindow.moveWindowContent;
UnitMenuTopWindow.moveWindowContent = function () {
    this._unitCounter.moveUnitCounter();
    return NL_AnimatedCharUnitMenu01.call(this);
};

UnitMenuTopWindow._drawUnitClass = function (xBase, yBase) {
	var textui = this.getWindowTextUI();
	var color = textui.getColor();
	var font = textui.getFont();
	var length = this._getClassTextLength();
	var x = xBase + 120;
	var y = yBase + 50;
	var cls = this._unit.getClass();
	var unitRenderParam;

	unitRenderParam = StructureBuilder.buildUnitRenderParam();
	unitRenderParam.direction = DirectionType.COUNT;
	unitRenderParam.animationIndex = this._unitCounter.getAnimationIndexFromUnit(this._unit);
	unitRenderParam.isScroll = false;
	UnitRenderer.drawScrollUnit(this._unit, x, y, unitRenderParam);
	TextRenderer.drawText(x + 45, y + 13, cls.getName(), length, color, font);
};
})();


			array.appendObject(UnitParameter.MOV);
			array.appendObject(UnitParameter.BLD);
			array.appendObject(UnitParameter.WLV);