/**
 * Plugin to fixate the heal window in the center
 * Plug and play
 * Overwrites HpRecoveryEventCommand._drawWindow
 * 
 * Plugin by Nelow/Lyn
 * */

HpRecoveryEventCommand._drawWindow = function () {

	var width = this._recoveryWindow.getWindowWidth();
	var height = this._recoveryWindow.getWindowHeight();
	var x = LayoutControl.getCenterX(-1, width);
	var y = LayoutControl.getCenterY(-1, height);

	if (this._isAsyncAnime()) {
		this._dynamicAnime.drawDynamicAnime();
	}

	this._recoveryWindow.drawWindow(x, y);
}