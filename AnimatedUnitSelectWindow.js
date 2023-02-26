/**
 * Plugin to animate the unit sprites in the Base/Battleprep window
 * overwrites the UnitSelectScrollbar.drawScrollContent method
 * 
 * Plugin by Nelow/Lyn
 * */
UnitSelectScrollbar._unitCounter = null;

UnitSelectScrollbar.initialize = function () {
    this._unitCounter = createObject(UnitCounter);
};

NL_AnimatedUnitSelectWindow01 = MarshalScreen.moveScreenCycle;
MarshalScreen.moveScreenCycle = function () {
	this._unitSelectWindow._scrollbar._unitCounter.moveUnitCounter();
	var result = NL_AnimatedUnitSelectWindow01.call(this);
	return result;
};

UnitSelectScrollbar.drawScrollContent = function(x, y, object, isSelect, index) {
	var range;
	var unit = object;
	var unitRenderParam = StructureBuilder.buildUnitRenderParam();
	var alpha = 255;
	var dx = Math.floor((this.getObjectWidth() - GraphicsFormat.CHARCHIP_WIDTH) / 2) + 16;
	var length = this._getTextLength();
	var textui = this.getParentTextUI();
	var color = textui.getColor();
	var font = textui.getFont();

	if (this._selectableArray !== null && !this._selectableArray[index]) {
		alpha = 128;
	}

	x += dx;
	y += 10;
	unitRenderParam.alpha = alpha;
	unitRenderParam.direction = DirectionType.COUNT;
	unitRenderParam.animationIndex = this._unitCounter.getAnimationIndexFromUnit(unit);
	unitRenderParam.isScroll = false;
	UnitRenderer.drawScrollUnit(unit, x, y, unitRenderParam);

	range = createRangeObject(x - 50, y + 30, length, 40);
	TextRenderer.drawRangeAlphaText(range, TextFormat.CENTER, unit.getName(), length, color, alpha, font);
}