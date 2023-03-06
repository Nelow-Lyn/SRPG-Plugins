/**
 * Plugin to make the Rescue Staff into an command.
 * I made this as customizable as i could.
 * Explanations of the Parameters you can change are below in the comments
 *
 * If you encounter any issues or need help checking for different things 
 * feel free to contact me on discord
 * 
 * Plugin by nelow/lyn
 *
 *
 * */



(function () {
	/**
	 * For the animation to be played.
	 * 
	 * ISRUNTIME defines if you want an effect from the base engine
	 * or if you want to use your own custom effect.
	 * true for runtime, false for original effect.
	 * 
	 * ANIMEID is the id of the effect.
	 * 
	 * 
	 * */
	var ISRUNTIME = true;
	var ANIMEID = 103;

	/**
	 * The Range the command has.
	 * */ 
	var RESCUESTAFFCOMMANDRANGE = 5;

	/**
	 * For the Condition the command shall show up with
	 * 
	 * CHECKSKILL If you want to check for a custom skill. true to enable, false to disable
	 * SKILLKEYWORD to define the keyword used by the skill to check for
	 * 
	 * CHECKSTATE If you want to check for a specific state. true to enable, false to disable
	 * STATEID the Id of the state you want to check for
	 * 
	 * CHECKCUSTOMPARAM If you want to check for a custom parameter true to enable, false to disable.
	 * CUSTOMPARAMNAME The name of the custom parameter to check for.
	 * CUSTOMPARAMNUMBER If just checking for the existance is not enough, you can specify a number to check for here.
	 * Only performs this check if the parameter is a number.
	 * 
	 * USESPERMAP Limits the uses of the command per map per unit. Each unit has its own counter. The counter gets reset every Map.
	 * If you do want unlimited uses, set this to -1
	 * 
	 * 
	 * */
	var CHECKSKILL = false;
	var SKILLKEYWORD = 'test';

	var CHECKSTATE = false;
	var STATEID = 0;

	var CHECKCUSTOMPARAM = true;
	var CUSTOMPARAMNAME = 'customParam';
	var CUSTOMPARAMNUMBER = 1;

	var USESPERMAP = 1;



	var NL_RescueStaffCommand01 = UnitCommand.configureCommands;

	UnitCommand.configureCommands = function (groupArray) {
		NL_RescueStaffCommand01.call(this, groupArray);
		groupArray.splice(groupArray.length - 1, 0, UnitCommand.RescueCommand);

	}

	var NL_RescueStaffCommand02 = MapStartFlowEntry._prepareMemberData;

	MapStartFlowEntry._prepareMemberData = function () {
		NL_RescueStaffCommand02.call(this);
		var list, count, i, unit;
		list = PlayerList.getSortieDefaultList();
		count = list.getCount();

		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			unit.custom.rescueStaffUsages = USESPERMAP;
        }
    }


	var RescueStaffCommandMode = {
		SELECTION: 0,
		RESULT: 1,
		ANIME: 2
	};

	UnitCommand.RescueCommand = defineObject(UnitListCommand,
		{
			_posSelector: null,
			_firstCheck: true,
			_dynamicEvent: null,

			openCommand: function () {
				this._prepareCommandMemberData();
				this._completeCommandMemberData();
			},

			moveCommand: function () {
				var mode = this.getCycleMode();
				var result = MoveResult.CONTINUE;

				if (mode === RescueStaffCommandMode.SELECTION) {
					result = this._moveSelection();
				}
				else if (mode === RescueStaffCommandMode.RESULT) {
					result = this._moveResult();
				} else if (mode === RescueStaffCommandMode.ANIME) {
					result = this._moveAnime();
                }

				return result;
			},

			drawCommand: function () {
				var mode = this.getCycleMode();

				if (mode === RescueStaffCommandMode.SELECTION) {
					this._drawSelection();
				}
				else if (mode === RescueStaffCommandMode.RESULT) {
					this._drawResult();
				}
				else if (mode === RescueStaffCommandMode.ANIME) {
					this._drawAnime();
				}
			},

			isCommandDisplayable: function () {

				if (USESPERMAP !== -1) {
					root.log(this.getCommandTarget().custom.rescueStaffUsages);
					if (this.getCommandTarget().custom.rescueStaffUsages === 0) {
						return false;
                    }
                }


				if (CHECKSKILL) {
					skill = SkillControl.getPossessionCustomSkill(this.getCommandTarget(), SKILLKEYWORD);
					if (skill !== null) {
						return true;
                    }
				}
				if (CHECKSTATE) {
					var state = root.getBaseData().getStateList().getDataFromId(STATEID);
					if (state !== null) {
						var state2 = StateControl.getTurnState(this.getCommandTarget(), state);
						if (state2 !== null) {
							return true;
                        }
                    }
				}
				if (CHECKCUSTOMPARAM) {
					if (typeof this.getCommandTarget().custom[CUSTOMPARAMNAME] !== 'undefined') {
						if (typeof this.getCommandTarget().custom[CUSTOMPARAMNAME] === 'number') {
							if (this.getCommandTarget().custom[CUSTOMPARAMNAME] === CUSTOMPARAMNUMBER) {
								return true;
							} else {
								return false;
							}
						} else {
							return true;
                        }
						return true;
                    }
                }

				return false;
			},

			getCommandName: function () {
				return "Rescue";
			},

			isRepeatMoveAllowed: function () {
				return false;
			},

			endCommandAction: function () {
				this.getCommandTarget().custom.rescueStaffUsages -= 1;
				UnitListCommand.endCommandAction.call(this);
				root.log(this._targetUnit.custom.rescueStaffUsages);
				this._targetUnit = null;
				this._pos = null;
				;
            },

			_prepareCommandMemberData: function () {
				this._posSelector = createObject(PosSelector);
			},

			_completeCommandMemberData: function () {
				this._startSelection();
			},

			_startSelection: function () {
				var unit = this.getCommandTarget();
				var filter = this._getUnitFilter();
				var indexArray = this._getIndexArray(unit.getMapX(), unit.getMapY(), 1, RESCUESTAFFCOMMANDRANGE);

				this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Attack, filter);
				this._posSelector.setFirstPos();

				this.changeCycleMode(RescueStaffCommandMode.SELECTION);
			},

			_moveSelection: function () {
				var result = this._posSelector.movePosSelector();

				if (result === PosSelectorResult.SELECT) {
					if (this._isPosSelectable()) {
						this._posSelector.endPosSelector();
						this.changeCycleMode(RescueStaffCommandMode.RESULT);
					}
				}
				else if (result === PosSelectorResult.CANCEL) {
					this._posSelector.endPosSelector();
					this.changeCycleMode(RescueStaffCommandMode.SELECTION);
					return MoveResult.END;
				}

				return MoveResult.CONTINUE;
			},

			_moveResult: function () {
				this._targetUnit = this._posSelector.getSelectorTarget(true);
				var dir = this._getDirection(this.getCommandTarget(), this._targetUnit);
				this._pos = this._getValidPos(dir, this._targetUnit);
				this._dynamicEvent = createObject(DynamicEvent);
				this._teleportAnime(this._targetUnit, this._pos);
				this._dynamicEvent.executeDynamicEvent();
				this.changeCycleMode(RescueStaffCommandMode.ANIME)
				return MoveResult.CONTINUE;
					
			},
			_moveAnime: function () {
				var result = this._dynamicEvent.moveDynamicEvent();

				if (result === MoveResult.END) {
					var list = root.getBaseData().getEffectAnimationList(ISRUNTIME);
					var anime = list.getDataFromId(ANIMEID);
					var dynamicEvent2 = createObject(DynamicEvent);
					var gen = dynamicEvent2.acquireEventGenerator();
					x = LayoutControl.getPixelX(this._pos.x);
					y = LayoutControl.getPixelX(this._pos.y - 1);
					position = LayoutControl.getMapAnimationPos(x, y, anime);
					gen.animationPlay(anime, position.x, position.y, false, AnimePlayType.SYNC, 1);
					dynamicEvent2.executeDynamicEvent();
					this._targetUnit.setMapX(this._pos.x);
					this._targetUnit.setMapY(this._pos.y);
					this.endCommandAction();
					return MoveResult.END;
				}
				return MoveResult.CONTINUE;
            },

			_drawSelection: function () {
				this._posSelector.drawPosSelector();
			},

			_drawResult: function () {
			},

			_drawAnime: function () {

			},

			_isPosSelectable: function () {
				var unit = this._posSelector.getSelectorTarget(true);
				if (unit !== null && unit.getUnitType() !== UnitType.PLAYER) {
					return false;
				}

				return unit !== null;
			},
			_getDirection: function (unit, targetUnit) {
				var angle = Math.atan2(targetUnit.getMapY() - unit.getMapY(), targetUnit.getMapX() -unit.getMapX())
				if (angle < 0) {
					angle = angle + (2 * Math.PI);
                }
				var deg = angle * (180 / Math.PI);
				if (deg >= 135 && deg <= 225) {
					return DirectionType.LEFT;
				} else if (deg >= 225 && deg <= 315) {
					return DirectionType.TOP;
				} else if (deg >= 315 || deg <= 45) {
					return DirectionType.RIGHT;
				} else if (deg >= 45 && deg <= 135) {
					return DirectionType.BOTTOM;
                }

            },
			_getValidPos: function (dir,targetUnit) {
				var unit = this.getCommandTarget();
				var mapUnit, pos;
				if (dir === DirectionType.TOP) {
					mapUnit = PosChecker.getUnitFromPos(unit.getMapX(), unit.getMapY() - 1);
					pos = createPos(unit.getMapX(), unit.getMapY() - 1);
				} else if (dir === DirectionType.BOTTOM) {
					mapUnit = PosChecker.getUnitFromPos(unit.getMapX(), unit.getMapY() + 1);
					pos = createPos(unit.getMapX(), unit.getMapY() + 1);
				} else if (dir === DirectionType.LEFT) {
					mapUnit = PosChecker.getUnitFromPos(unit.getMapX() - 1, unit.getMapY());
					pos = createPos(unit.getMapX() - 1, unit.getMapY());
				} else if (dir === DirectionType.RIGHT) {
					mapUnit = PosChecker.getUnitFromPos(unit.getMapX() + 1, unit.getMapY());
					pos = createPos(unit.getMapX() + 1, unit.getMapY());
				}
				if (mapUnit !== null) {
					pos = PosChecker.getNearbyPos(unit, targetUnit);
					return pos;
				}
				return pos;
			},

			_teleportAnime: function (targetUnit, pos) {
				var gen = this._dynamicEvent.acquireEventGenerator();
				var list = root.getBaseData().getEffectAnimationList(ISRUNTIME);
				var anime = list.getDataFromId(ANIMEID);
				var x = LayoutControl.getPixelX(targetUnit.getMapX());
				var y = LayoutControl.getPixelY(targetUnit.getMapY() - 1);
				var position = LayoutControl.getMapAnimationPos(x, y, anime);

				gen.animationPlay(anime, position.x, position.y, false, AnimePlayType.SYNC, 1);
            },

			_getUnitFilter: function () {
				return FilterControl.getReverseFilter(this.getCommandTarget().getUnitType());
			},

			_getIndexArray: function (x, y, startRange, endRange) {
				var i, index, x, y, result;
				var indexArrayNew = [];
				var indexArray = IndexArray.getBestIndexArray(x, y, startRange, endRange);
				var count = indexArray.length;

				for (i = 0; i < count; i++) {
					index = indexArray[i];
					x = CurrentMap.getX(index);
					y = CurrentMap.getY(index);
					var unit = PosChecker.getUnitFromPos(x, y);
					if (unit !== null && unit.getUnitType() === UnitType.PLAYER) {
						indexArrayNew.push(index);
					} 
				}

				return indexArrayNew;
			}

		}
	);
})();