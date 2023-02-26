/**
 * Plugin to keep the names displayed
 * when the option to blackout the message
 * is selected.
 * The color for the blackout can be customized with the
 * variable selectBlackoutColor in hex
 * 
 * Plugin by Nelow/Lyn
 * 
 **/
(function () {
	var selectBlackoutColor = 0x808080; //Change this to a hex color of your choice

    NL_messageView01 = BaseMessageView.drawMessageView;
	BaseMessageView.drawMessageView = function (isActive, pos) {
		NL_messageView01.call(this, isActive, pos);
		var xName = pos.x + this._messageLayout.getNameX();
		var yName = pos.y + this._messageLayout.getNameY();
		if (!isActive) {
			this.drawBlackoutName(xName, yName);
		}
	};

	BaseMessageView.drawBlackoutName = function (x, y) {
		var text = this._name;
		var textui, color, font, pic;

		if (text === '' || !this._isNameDisplayable) {
			return;
		}

		textui = this._messageLayout.getNameTextUI();
		color = selectBlackoutColor;
		font = textui.getFont();
		pic = textui.getUIImage();
		pic.setAlpha(0);
		pic.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());


		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, 4);
	};
}) ();