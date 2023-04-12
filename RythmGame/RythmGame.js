/**
 * Rythm Game Plugin!
 * 
 * This plugin adds a command for units to start a rythm game
 * By default this plugin provides the basic UI,
 * hit detection for the arrows and a few ways to generate the arrows.
 * The first way is with the TimingArray in this file. Be aware that the array
 * has to be the exact format as provided. [{time:number, type: number}, {time:number, type: number}].
 * The time is in frames, the type is for which arrow between 0 and  3.
 * 
 * The second way is to set it ingame with an execute script event. In that event select execute code and type for example:
 * TimingArray = [{time: 7, type:0}, {time: 7, type:0}, {time: 7, type:0}];
 * 
 * the third way, random generation. If the Timing array has less than 2 entries, the code will randomly generate arrows for you.
 * 
 * Hit detection is handled by _checkHit.
 * It is rather simple to adjust when something is counted as a perfect, good or miss.
 * The yDiff variable is in pixels, an arrow moves 4/5 pixels per frame (Depending if the game runs 30/60 fps)
 * 
 * There will be a way to set a music track in the future.
 * 
 * 
 * */

var Ressource_picture_settings = {
	Folder: 'RythmGameImages',
	UpArrow: 'up_arrow.png',
	DownArrow: 'down_arrow.png',
	LeftArrow: 'left_arrow.png',
	RightArrow: 'right_arrow.png',
	Line: 'Underline2.png'
};

var RythmCommandMode = {
	TOP: 0,
	RYHTM: 1,
	END: 2
}

var TimingArray = [
	{ time: 7, type: 0 }, { time: 0, type: 1 }, { time: 15, type: 0 }, { time: 15, type: 2 }, { time: 15, type: 0 }, { time: 30, type: 1 }, { time: 7, type: 0 }, { time: 30, type: 1 },
	{ time: 12, type: 0 }, { time: 12, type: 1 }, { time: 22, type: 0 }, { time: 15, type: 1 }, { time: 15, type: 3 }, { time: 22, type: 1 }, { time: 22, type: 3 }, { time: 22, type: 1 }
]

UnitCommand.Rythm = defineObject(UnitListCommand,
	{
		_targetY: 520,
		_arrowArray: [],
		_delayCounter: 0,


		openCommand: function () {
			this._prepareCommandMemberData();
			this._completeCommandMemberData();
		},

		moveCommand: function () {
			var mode = this.getCycleMode();
			var result = MoveResult.CONTINUE;

			if (mode === RythmCommandMode.TOP) {
				result = this._moveTop();
			}
			else if (mode === RythmCommandMode.RYHTM) {
				result = this._moveRythm();
			}
			else if (mode === RythmCommandMode.END) {
				result = this._moveEnd();
			}

			return result;
		},

		drawCommand: function () {
			var mode = this.getCycleMode();

			if (mode === RythmCommandMode.TOP) {
				this._drawTop();
			}
			else if (mode === RythmCommandMode.RYHTM) {
				this._drawSelection();
			}
			else if (mode === RythmCommandMode.END) {
				this._drawUse();
			}
		},

		isCommandDisplayable: function () {
			return UnitItemControl.getPossessionItemCount(this.getCommandTarget()) > 0;
		},

		getCommandName: function () {
			return 'Dance!';
		},

		isRepeatMoveAllowed: function () {
			return false;
		},

		_prepareCommandMemberData: function () {

			this._windowpic = root.getBaseData().getUIResourceList(UIType.MENUWINDOW, true).getDataFromId(0);
			this._linePic = root.getMaterialManager().createImage(Ressource_picture_settings.Folder, Ressource_picture_settings.Line);
			this._startY = LayoutControl.getCenterY(-1, 554);
			this._targetY = LayoutControl.getCenterY(-1, 554) + 500;

		},

		_completeCommandMemberData: function () {

			this._count = 500;
			if (TimingArray.length > 1) {
				this._count = TimingArray.length;
            }
			this._beatCount = 0;
			this._createArrowObject();
			this._count--;
			this.changeCycleMode(RythmCommandMode.TOP);
			this._delayCounter = 0;
			this._perfectHitCounter = 0;
			this._goodHitCounter = 0;
			this._missHitCounter = 0;
		},

		_moveTop: function () {
			var unit = this.getCommandTarget();
			var result = MoveResult.CONTINUE
			var count = this._arrowArray.length;
			var closestArrow = null;
			var yDiff = 200;
			var input = InputControl.getDirectionState();
			var saveIndex = -1;
			var deletedArrow = null;

			if (this._count !== 0) {
				this._createArrowObject();
				this._count--;
            }

			for (i = 0; i < count; i++) {
				if (this._arrowArray[i].getDelay() === this._delayCounter) {
					this._arrowArray[i].setVisible(true);
				}

				if (!this._arrowArray[i].isVisible() && this._arrowArray[i].getY() !== this._startY) {
					saveIndex = i;
				}

				this._arrowArray[i].move();
			}
			if (count === 0) {
				this.changeCycleMode(RythmCommandMode.RYHTM);
			}
			if (saveIndex !== -1) {
				deletedArrow = this._arrowArray.splice(saveIndex, 1);
				if (deletedArrow[0].getY() >= deletedArrow[0]._endLine) {
					this._missHitCounter++;
                }
				saveIndex = -1;
            }

			if (input === InputType.UP) {
				closestArrow = this._getClosestArrow(RythmArrowType.UP);
				if (closestArrow[0] != null) {
					yDiff = Math.abs(closestArrow[0].getY() - this._targetY);
					if (this._checkHit(yDiff)) {
						closestArrow[0].setVisible(false);
                    }
				}
			}

			else if (input === InputType.DOWN) {
				closestArrow = this._getClosestArrow(RythmArrowType.DOWN);
				if (closestArrow[0] != null) {
					yDiff = Math.abs(closestArrow[0].getY() - this._targetY);
					if (this._checkHit(yDiff)) {
						closestArrow[0].setVisible(false);
					}
				}
			}

			else if (input === InputType.LEFT) {
				closestArrow = this._getClosestArrow(RythmArrowType.LEFT);
				if (closestArrow[0] != null) {
					yDiff = Math.abs(closestArrow[0].getY() - this._targetY);
					if (this._checkHit(yDiff)) {
						closestArrow[0].setVisible(false);
					}
				

				}
			}

			else if (input === InputType.RIGHT) {
				closestArrow = this._getClosestArrow(RythmArrowType.RIGHT);
					if (closestArrow[0] != null) {
						yDiff = Math.abs(closestArrow[0].getY() - this._targetY);
						if (this._checkHit(yDiff)) {
							closestArrow[0].setVisible(false);
						}
					}
			}
			this._delayCounter++;
			return MoveResult.CONTINUE;
		},

		_moveRythm: function () {
			root.log(this._perfectHitCounter);
			this.changeCycleMode.END
			return MoveResult.END;
		},

		_drawTop: function () {
			var count = this._arrowArray.length;
			var x = LayoutControl.getCenterX(-1, 256);
			var y = LayoutControl.getCenterY(-1, 554);
			WindowRenderer.drawStretchWindow(x, y, 256, 490, this._windowpic);
			WindowRenderer.drawStretchWindow(x, y + 490, 256, 64, this._windowpic);
			WindowRenderer.drawStretchWindow(x + 256, y, 110, 70, this._windowpic);
			TextRenderer.drawText(x + 240, y + 5, 'Perfect: ', 50, ColorValue.DEFAULT, TextRenderer.getDefaultFont());
			NumberRenderer.drawNumber(x + 295, y , this._perfectHitCounter);
			TextRenderer.drawText(x + 240, y + 25, 'Good: ', 50, ColorValue.DEFAULT, TextRenderer.getDefaultFont());
			NumberRenderer.drawNumber(x + 295, y + 20, this._goodHitCounter);
			TextRenderer.drawText(x + 240, y + 45, 'Miss: ', 50, ColorValue.DEFAULT, TextRenderer.getDefaultFont());
			NumberRenderer.drawNumber(x + 295, y + 40, this._missHitCounter);
			this._drawLineInternal(this._linePic, x + 64, y, 20, 450);
			this._drawLineInternal(this._linePic, x + 128, y, 20, 450);
			this._drawLineInternal(this._linePic, x + 192, y, 20, 450);
			for (i = 0; i < count; i++) {
				this._arrowArray[i].draw();
			};
		},

		_drawSelection: function () {
		},

		_drawUse: function () {
		},

		_useItem: function () {

		},

		_drawLineInternal: function (pic, x, y, width, height) {
			var i;
			var xSrc = 8 * 1;

			if (pic === null) {
				return;
			}

			// Draw the left edge.
			pic.drawParts(x, y, 40, 0, 10, 40);
			y += 40;

			pic.drawParts(x, y, 40, 40, width, height);
			y += 40;

			// Draw the right edge.
			pic.drawParts(x, y, 0, 40, 10, 20);
		},

		_getClosestArrow: function (type) {

			var count = this._arrowArray.length;
			var y = 0;
			var closestY = 900;
			var savedIndex = -1;
			for (i = 0; i < count; i++) {
				if (this._arrowArray[i].getArrowType() === type) {

					if (Math.abs(this._arrowArray[i].getY() - this._targetY) < closestY) {
						closestY = Math.abs(this._arrowArray[i].getY() - this._targetY);
						savedIndex = i;
                    }
				}

			}
			root.log(closestY + " " + savedIndex);
			return this._arrowArray.slice(savedIndex, savedIndex + 1);

		},

		_checkHit: function (yDiff) {
			if (yDiff <= 10) {
				this._perfectHitCounter++;
				return true;
			} else if (yDiff <= 15) {
				this._goodHitCounter++;
				return true;
			} else if (yDiff > 15 && yDiff < 80) {
				this._missHitCounter++;
				return true;
			}

			return false;
		},

		_createArrowObject: function () {
			var randomArrow, arrowObject, pic;
			if (TimingArray.length >= 1) {
				this._beatCount += TimingArray[0].time;
				randomArrow = TimingArray[0].type;
				TimingArray.shift();
			} else {
				randomArrow = Math.floor(Math.random() * 4);
				this._beatCount += 15;
            }

			if (randomArrow === 0) {
				pic = root.getMaterialManager().createImage(Ressource_picture_settings.Folder, Ressource_picture_settings.UpArrow);
				arrowObject = createObject(UpRythmArrow)
				arrowObject.setPicture(pic);
				
				arrowObject.setDelay(this._beatCount);
				arrowObject.setX(LayoutControl.getCenterX(-1, 256) + 64);
				arrowObject.setY(LayoutControl.getCenterY(-1, 554));
				arrowObject.setEndLine(LayoutControl.getCenterY(-1, 554) + 604);
				this._arrowArray.push(arrowObject);
				arrowObject = null;
			} else if (randomArrow === 1) {
				pic = root.getMaterialManager().createImage(Ressource_picture_settings.Folder, Ressource_picture_settings.DownArrow);
				arrowObject = createObject(DownRythmArrow);
				arrowObject.setPicture(pic);
				arrowObject.setDelay(this._beatCount);
				arrowObject.setX(LayoutControl.getCenterX(-1, 256) + 128);
				arrowObject.setY(LayoutControl.getCenterY(-1, 554));
				arrowObject.setEndLine(LayoutControl.getCenterY(-1, 554) + 604);
				this._arrowArray.push(arrowObject);
				arrowObject = null;
			} else if (randomArrow === 2) {
				pic = root.getMaterialManager().createImage(Ressource_picture_settings.Folder, Ressource_picture_settings.LeftArrow);
				arrowObject = createObject(LeftRythmArrow);
				arrowObject.setPicture(pic);
				arrowObject.setDelay(this._beatCount);
				arrowObject.setX(LayoutControl.getCenterX(-1, 256));
				arrowObject.setY(LayoutControl.getCenterY(-1, 554));
				arrowObject.setEndLine(LayoutControl.getCenterY(-1, 554) + 604);
				this._arrowArray.push(arrowObject);
				arrowObject = null;
			} else if (randomArrow === 3) {
				pic = root.getMaterialManager().createImage(Ressource_picture_settings.Folder, Ressource_picture_settings.RightArrow);
				arrowObject = createObject(RightRythmArrow);
				arrowObject.setPicture(pic);
				arrowObject.setDelay(this._beatCount);
				arrowObject.setX(LayoutControl.getCenterX(-1, 256) + 192);
				arrowObject.setY(LayoutControl.getCenterY(-1, 554));
				arrowObject.setEndLine(LayoutControl.getCenterY(-1, 554) + 604);
				this._arrowArray.push(arrowObject);
				arrowObject = null;
			}
        }

	}
);


var NL_RythmCommand01 = UnitCommand.configureCommands;

UnitCommand.configureCommands = function (groupArray) {
	NL_RythmCommand01.call(this, groupArray);
	groupArray.splice(groupArray.length - 1, 0, UnitCommand.Rythm);
}


var RythmArrowType = {
	UP: 0,
	DOWN: 1,
	LEFT: 2,
	RIGHT: 3
}

var BaseRythmArrow = defineObject(BaseObject, {
	_x: 0,
	_y: 0,
	_isVisible: false,
	_endLine: 570,
	_delay: 0,

	setVisible: function (isVisible) {
		this._isVisible = isVisible;
	},

	setPicture: function (pic) {
		this._pic = pic;
    },

	isVisible: function () {
		return this._isVisible;
	},

	getX: function () {
		return this._x;
	},

	getY: function () {
		return this._y;
	},

	setX: function (x) {
		this._x = x;
	},

	setY: function (y) {
		this._y = y
	},

	setEndLine: function (endY) {
		this._endLine = endY;
    },

	isEnd: function () {
		if (this._y >= this._endLine) {
			return true;
		}
		return false;
	},

	setDelay: function (delay) {
		this._delay = delay;
	},

	getDelay: function () {
		return this._delay;
    }

});

var UpRythmArrow = defineObject(BaseRythmArrow, {

	move: function () {

		if (!this.isVisible()) {
			return;
		}

		this._y += this._getPixel();

		if (this.isEnd()) {
			this._isVisible = false
			return;
        }

	},

	draw: function () {
		if (!this.isVisible()) {
			return;
		}
		this._pic.draw(this._x, this._y);
    },
	_getPixel: function () {
		return DataConfig.isHighResolution() ? 5 : 4;
	},

	getArrowType: function () {
		return RythmArrowType.UP;
    }
});

var DownRythmArrow = defineObject(BaseRythmArrow, {

	_x: 550,

	move: function () {

		if (!this.isVisible()) {
			return;
		}

		this._y += this._getPixel();

		if (this.isEnd()) {
			this._isVisible = false
			return;
		}

	},

	draw: function () {
		if (!this.isVisible()) {
			return;
		}
		this._pic.draw(this._x, this._y);
	},
	_getPixel: function () {
		return DataConfig.isHighResolution() ? 5 : 4;
	},
	getArrowType: function () {
		return RythmArrowType.DOWN;
	}
});

var LeftRythmArrow = defineObject(BaseRythmArrow, {

	_x: 450,

	move: function () {

		if (!this.isVisible()) {
			return;
		}

		this._y += this._getPixel();

		if (this.isEnd()) {
			this._isVisible = false
			return;
		}

	},

	draw: function () {
		if (!this.isVisible()) {
			return;
		}
		this._pic.draw(this._x, this._y);
	},
	_getPixel: function () {
		return DataConfig.isHighResolution() ? 5 : 4;
	},
	getArrowType: function () {
		return RythmArrowType.LEFT;
	}
});

var RightRythmArrow = defineObject(BaseRythmArrow, {

	_x: 600,


	move: function () {

		if (!this.isVisible()) {
			return;
		}

		this._y += this._getPixel();

		if (this.isEnd()) {
			this._isVisible = false
			return;
		}

	},

	draw: function () {
		if (!this.isVisible()) {
			return;
		}
		this._pic.draw(this._x, this._y);
	},
	_getPixel: function () {
		return DataConfig.isHighResolution() ? 5 : 4;
	},
	getArrowType: function () {
		return RythmArrowType.RIGHT;
	}
});