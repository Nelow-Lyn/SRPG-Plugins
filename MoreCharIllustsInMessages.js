/**
 * Plugin to Display more than 3 Char illustrations at once.
 * To use there are 4 new control characters you use in a message.
 * The message type (aka TOP, MIDDLE, BOTTOM) doesnt matter for the control characters.
 * 
 * The control characters are:
 * \mtl
 * \mtr
 * \dtl
 * \dtr
 * 
 * \mtl and \mtr are for creating the new messages, they will use the message layout
 * defined in the variables below.
 * 
 * \dtl and \dtr are for deleting those messages, just put them in an empty message and it will
 * deletethe old message and skip to the next one.
 * 
 * To pick which message layout they should use, set LEFTLAYOUTID and RIGHTLAYOUTID
 * to the id of the message layout.
 * 
 * Plugin by Nelow/Lyn
 * */



var LEFTLAYOUTID = 5;
var RIGHTLAYOUTID = 6;


var MessagePos = {
	TOP: 0,
	CENTER: 1,
	BOTTOM: 2,
	NONE: 3,
	TOPLEFT: 4,
	TOPRIGHT: 5,
	DELETETOPLEFT: 6,
	DELETETOPRIGHT: 7
}

FaceView._topLeftView = null;
FaceView._topRightView = null;

ControlVariable.moreMessagesLeft = defineObject(BaseControlVariable,
	{
		getKey: function () {
			var key = /\\mtl/;

			return key;
		},

		isDrawingObject: function () {
			return false;
		}
	}
);
ControlVariable.moreMessagesRight = defineObject(BaseControlVariable,
	{
		getKey: function () {
			var key = /\\mtr/;

			return key;
		},

		isDrawingObject: function () {
			return false;
		}
	}
);

var NL_moreMessages01 = TextParser._configureVariableObject;

TextParser._configureVariableObject = function (groupArray) {
	NL_moreMessages01.call(this, groupArray);
	groupArray.appendObject(ControlVariable.moreMessagesLeft);
	groupArray.appendObject(ControlVariable.moreMessagesRight);
};

var NL_moreMessages02 = MessageShowEventCommand._createMessageViewParam;

MessageShowEventCommand._createMessageViewParam = function () {
	var eventCommandData = root.getEventCommandObject();
	var messageViewParam = NL_moreMessages02.call(this);
	if (messageViewParam.text.match(/\\mtl/)) {
		messageViewParam.pos = MessagePos.TOPLEFT;
		messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getDataFromId(LEFTLAYOUTID);
		root.log(messageViewParam.text);
	}
	if (messageViewParam.text.match(/\\mtr/)) {
		messageViewParam.pos = MessagePos.TOPRIGHT;
		messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getDataFromId(RIGHTLAYOUTID);
		root.log(messageViewParam.text);
	}
	if (messageViewParam.text.match(/\\dtl/)) {
		messageViewParam.pos = MessagePos.DELETETOPLEFT;
    }
	if (messageViewParam.text.match(/\\dtr/)) {
		messageViewParam.pos = MessagePos.DELETETOPRIGHT;
    }
	return messageViewParam;
};

var FaceViewTopLeft = defineObject(BaseMessageView,
	{
	}
);
var FaceViewTopRight = defineObject(BaseMessageView,
	{
	}
);

var NL_moreMessages03 = FaceView.setupMessageView;

FaceView.setupMessageView = function (messageViewParam) {
	NL_moreMessages03.call(this, messageViewParam);
	var pos = messageViewParam.pos;
	root.log(pos);
	if (pos === MessagePos.TOPLEFT) {
		if (this._topLeftView === null) {
			this._topLeftView = createObject(FaceViewTopLeft);
			if (messageViewParam.messageLayout === null) {
				messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.TOP);
			}
			
		}
		this._topLeftView.setupMessageView(messageViewParam);

	}
	if (pos === MessagePos.TOPRIGHT) {
		if (this._topRightView === null) {
			this._topRightView = createObject(FaceViewTopRight);
			if (messageViewParam.messageLayout === null) {
				messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.TOP);
			}
			
		}
		this._topRightView.setupMessageView(messageViewParam);
	}
	if (pos === MessagePos.DELETETOPLEFT) {
		if (this._topLeftView !== null) {
			this._topLeftView.endMessageView();
			this._topLeftView = null;
		}
	}
	if (pos === MessagePos.DELETETOPRIGHT) {
		if (this._topLeftView !== null) {
			this._topRightView.endMessageView();
			this._topRightView = null;
		}
	}

	this._activePos = pos;
};

var NL_moreMessages04 = FaceView.moveMessageView;

FaceView.moveMessageView = function () {
	var result = NL_moreMessages04.call(this);
	if (this._activePos === MessagePos.TOPLEFT) {
		result = this._topLeftView.moveMessageView();
	}
	if (this._activePos === MessagePos.TOPRIGHT) {
		result = this._topRightView.moveMessageView();
	}
	if (this._activePos === MessagePos.DELETETOPLEFT) {
		result = MoveResult.END;
	}
	if (this._activePos === MessagePos.DELETETOPRIGHT) {
		result = MoveResult.END;
	}
	return result;
};

FaceView.drawMessageView = function() {
	var view = null;
	var isActive = true;
	var isTopActive = true;
	var isCenterActive = true;
	var isBottomActive = true;
	var isTopLeftActive = true;
	var isTopRightActive = true;

	if (root.isMessageBlackOutEnabled()) {
		isTopActive = this._activePos === MessagePos.TOP;
		isCenterActive = this._activePos === MessagePos.CENTER;
		isBottomActive = this._activePos === MessagePos.BOTTOM;
		isTopLeftActive = this._activePos === MessagePos.TOPLEFT;
		isTopRightActive = this._activePos === MessagePos.TOPRIGHT;
	}

	this._drawFaceViewCharIllust(isTopActive, isCenterActive, isBottomActive, isTopLeftActive, isTopRightActive);

	if (this._isMessageWindowFixed()) {
		if (this._activePos === MessagePos.TOP) {
			view = this._topView;
			isActive = isTopActive;
		}
		else if (this._activePos === MessagePos.CENTER) {
			view = this._centerView;
			isActive = isCenterActive;
		}
		else if (this._activePos === MessagePos.BOTTOM) {
			view = this._bottomView;
			isActive = isBottomActive;
		}
		else if (this._activePos === MessagePos.TOPLEFT) {
			view = this._topLeftView;
			isActive = isTopLeftActive;
		}
		else if (this._activePos === MessagePos.TOPRIGHT) {
			view = this._topRightView;
			isActive = isTopRightActive;
		}

		if (view !== null) {
			// By calling getMessageBottomPos, the window is displayed toward the bottom.
			view.drawMessageView(isActive, BaseMessageView.getMessageBottomPos.call(view));
		}
	}
	else {
		if (this._topView !== null) {
			this._topView.drawMessageView(isTopActive, this._topView.getMessagePos());
		}

		if (this._centerView !== null) {
			this._centerView.drawMessageView(isCenterActive, this._centerView.getMessagePos());
		}

		if (this._bottomView !== null) {
			this._bottomView.drawMessageView(isBottomActive, this._bottomView.getMessagePos());
		}

		if (this._topLeftView !== null) {
			this._topLeftView.drawMessageView(isTopLeftActive, this._topLeftView.getMessagePos());
		}

		if (this._topRightView !== null) {
			this._topLeftView.drawMessageView(isTopLeftActive, this._topLeftView.getMessagePos());
		}
	}
}
var NL_moreMessages05 = FaceView._drawFaceViewCharIllust;

FaceView._drawFaceViewCharIllust = function (isTopActive, isCenterActive, isBottomActive, isTopLeftActive, isTopRightActive) {
	NL_moreMessages05.call(this, isTopActive, isCenterActive, isBottomActive);
	if (this._topLeftView !== null) {
		this._topLeftView.drawCharIllust(isTopLeftActive);
	}
	if (this._topRightView !== null) {
		this._topRightView.drawCharIllust(isTopRightActive);
	}
}
var NL_moreMessages06 = FaceView.eraseMessage;
FaceView.eraseMessage = function (flag) {
	NL_moreMessages06.call(this, flag);
	if (flag === MessageEraseFlag.ALL) {
		if (this._topLeftView !== null) {
			this._topLeftView.endMessageView();
			this._topLeftView = null;
		}
		if (this._topRightView !== null) {
			this._topRightView.endMessageView();
			this._topRightView = null;
		}
    }
}