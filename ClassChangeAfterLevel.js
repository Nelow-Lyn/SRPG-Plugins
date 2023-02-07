/**
 * This Plugin allows you to set up automatic class changes after a unit reaches a certain level.
 * To set this up a unit needs the following custom parameters:
 * {classChangeLevel: {level: number, classId: number, addStats: true/false},
 * parameterArray: {hp:number, str: number, mag: number, skl: number, spd: number, lck: number, def: number, res: number, mov: number, wlv: number, bld: number}}
 * 
 * The first row of parameters is required for the plugin to function.
 * 
 * level is the target level when the unit should class change. For example if you want the levelcap be 20 and a further level up changes the class, then set this
 * to 20. The unit will not receive the bonus parameter of the additional level up.
 * 
 * classId is the Id of the class you want the unit to change to. This can be looked up in the Database of the classes.
 * 
 * addStats is a true or false parameter if you want to add stats for the class change seperate from class boni the unit would get.
 * If this is true it will be shown in its own window after the class change. Also requires the second custom parameter line parameterArray to work.
 * 
 * The parameterArray custom parameter is an array of the stats you want to give the unit upon class change.
 * 
 * an example custom parameter for a unit could look like this:
 * 
 * {classChangeLevel: {level:2, classId:2, addStats:true},
 * parameterArray: {hp:1, str: 1, mag:1, skl: 2, spd: 0, lck: 2, def: 1, res: 1, mov:1, wlv:0, bld:0}}
 * 
 *
 * Plugin by Nelow/Lyn
 */


(function () {

	var skipEasyClassAnime = false; //Change this to show/hide the Class up event effect after an Easy Battle. True = hide, False = show the effect
	var skipParameterChange = false; // Change this to show/hide the Parameter Change window. True = hide, False = show the window
	var customRealBattleAnime = false; // If you want a different animation to play set this to true, otherwise leave it at false
	var customRealBattleAnimeId = 0; //The Id of the custom animation you want to play. This needs to be an Original effect, not an RTP effect. 
									// customRealBattleAnimeId has no effect if customRealBattleAnime is set to false.
	var skipBonusClassAnime = false //Change this to show/hide the Class up event effect during the bonus exp screen. True = hide, False = show the effect
	var customBonusClassChangeAnime = false; //The same as customRealBattleAnime but for the bonus screen.
	var customBonusClassChangeAnimeId = 4; //The same as customRealBattleAnimeId but for the bonus screen.


	var ClassChangeLevelUpMode = {
		ANIME: 0,
		EVENT: 1
	};

	var ClassChangeLevelUpFlowEntry = defineObject(BaseFlowEntry,
		{
			_dynamicEvent: null,

			enterFlowEntry: function (coreAttack) {
				var attackFlow = coreAttack.getAttackFlow();
				var order = attackFlow.getAttackOrder();

				this._coreAttack = coreAttack;
				this._unit = attackFlow.getPlayerUnit();
				var generator;
				var attackFlow = coreAttack.getAttackFlow();
				if (this._coreAttack.isRealBattle()) {
					this._changeClassAnime();
				}

				if (typeof this._unit.custom.classChangeLevel === 'undefined' || this._unit.custom.classChangeLevel.reachedLevel !== true) {
					return EnterResult.NOTENTER;
				}

				if (this.isFlowSkip() || coreAttack.isBattleCut()) {
					this._doSkipAction();
					return EnterResult.NOTENTER;
				}

				this._dynamicEvent = createObject(DynamicEvent);
				generator = this._dynamicEvent.acquireEventGenerator();

				this._classChangeEvent(this._unit, generator);
				if (this._coreAttack.isRealBattle()) {
					this.changeCycleMode(ClassChangeLevelUpMode.ANIME);
				} else {
					this.changeCycleMode(ClassChangeLevelUpMode.EVENT);
					this._dynamicEvent.executeDynamicEvent();
                }
				
				return EnterResult.OK;
			},

			moveFlowEntry: function () {
				var mode = this.getCycleMode();
				var result = MoveResult.CONTINUE;

				if (mode === ClassChangeLevelUpMode.ANIME) {
					result = this._moveAnime();
				}
				else if (mode === ClassChangeLevelUpMode.EVENT) {
					result = this._dynamicEvent.moveDynamicEvent();
				}
				return result;
			},

			_classChangeEvent: function (unit, generator) {

				var list = root.getBaseData().getClassList();
				var cls = list.getDataFromId(unit.custom.classChangeLevel.classId);
				if (this._coreAttack.isRealBattle()) {
					generator.classChange(unit, cls, true);
				}
				else {
					generator.classChange(unit, cls, skipEasyClassAnime);
                }
				

			},
			_doSkipAction: function () {
				var list = root.getBaseData().getClassList();
				var cls = list.getDataFromId(this._unit.custom.classChangeLevel.classId);
				this._unit.setClass(cls);
			},

			_changeClassAnime: function () {
				var pos;
				var animeData = root.queryAnime('classchange');
				var isRight = true;
				var battleObject = this._coreAttack.getBattleObject();
				var battler = battleObject.getBattler(isRight);

				if (customRealBattleAnime) {
					var list = root.getBaseData().getEffectAnimationList(false);
					animeData = list.getDataFromId(customRealBattleAnimeId);
                }

				if (battler.getUnit() !== this._unit) {
					isRight = false;
					battler = battleObject.getBattler(isRight);
				}

				pos = battler.getEffectPos(animeData);
				this._effect = battleObject.createEffect(animeData, pos.x, pos.y, isRight, false);
				return pos;
				},

			_moveAnime: function () {

				if (this._effect.isEffectLast()) {
					this.changeCycleMode(ClassChangeLevelUpMode.EVENT);
					this._dynamicEvent.executeDynamicEvent();
				}

				return MoveResult.CONTINUE;
			}

		}
	);

	var ClassChangeLevelUpParamFlowEntry = defineObject(BaseFlowEntry,
		{
			_dynamicEvent: null,

			enterFlowEntry: function (coreAttack) {
				
				var attackFlow = coreAttack.getAttackFlow();
				var order = attackFlow.getAttackOrder();

				this._coreAttack = coreAttack;
				this._unit = attackFlow.getPlayerUnit();
				var generator = root.getEventGenerator();
				var attackFlow = coreAttack.getAttackFlow();

				if (typeof this._unit.custom.classChangeLevel === 'undefined' || this._unit.custom.classChangeLevel.reachedLevel !== true) {
					return EnterResult.NOTENTER;
                }

				if (this.isFlowSkip() || coreAttack.isBattleCut()) {
					this._doSkipAction();
					return EnterResult.NOTENTER;
				}


				this._dynamicEvent = createObject(DynamicEvent);
				generator = this._dynamicEvent.acquireEventGenerator();
				this._setParameterEvent(this._unit, generator);
				this._unit.custom.classChangeLevel.reachedLevel = false;
				this._unit.custom.classChangeLevel.level = 0;
				return this._dynamicEvent.executeDynamicEvent();
			},

			moveFlowEntry: function () {
				return this._dynamicEvent.moveDynamicEvent();
			},

			_setParameterEvent: function (unit, generator) {

				var objectgen = root.getObjectGenerator();
				var dummyunit = objectgen.generateUnitFromBaseUnit(unit);
				var parameter = dummyunit.getGrowthBonus();
				dummyunit.setAliveState(AliveType.ERASE);

				var addStats = false;
				if (typeof this._unit.custom.classChangeLevel.addStats === 'boolean') {
					addStats = this._unit.custom.classChangeLevel.addStats;
				}
				if (addStats) {
					parameter = this._createParameter(parameter);
				}
				generator.parameterChange(unit, parameter, skipParameterChange);

			},
			_doSkipAction: function () {
				if (typeof this._unit.custom.classChangeLevel.addStats === 'boolean') {
					addStats = this._unit.custom.classChangeLevel.addStats;
				}
				if (addStats) {
					var objectgen = root.getObjectGenerator();
					var dummyunit = objectgen.generateUnitFromBaseUnit(this._unit);
					var parameter = dummyunit.getGrowthBonus();
					dummyunit.setAliveState(AliveType.ERASE);
					this._skipCheck = true;
					var param = this._createParameter(parameter);
					this._skipCheck = false;
					ExperienceControl.plusGrowth(this._unit, param);
					this._unit.custom.classChangeLevel.reachedLevel = false;
					this._unit.custom.classChangeLevel.level = 0;
				}
            },

			_createParameter: function (parameter) {
				var paramArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				var count = ParamGroup.getParameterCount();
				var param = parameter;
				

				if (typeof this._unit.custom.parameterArray === 'undefined') {
					return parameter;
				}

				if (typeof this._unit.custom.parameterArray.hp === 'number') {
					paramArray[0] = this._unit.custom.parameterArray.hp;
				}
				if (typeof this._unit.custom.parameterArray.str === 'number') {
					paramArray[1] = this._unit.custom.parameterArray.str;
				}
				if (typeof this._unit.custom.parameterArray.mag === 'number') {
					paramArray[2] = this._unit.custom.parameterArray.mag;
				}
				if (typeof this._unit.custom.parameterArray.skl === 'number') {
					paramArray[3] = this._unit.custom.parameterArray.skl;
				}
				if (typeof this._unit.custom.parameterArray.spd === 'number') {
					paramArray[4] = this._unit.custom.parameterArray.spd;
				}
				if (typeof this._unit.custom.parameterArray.lck === 'number') {
					paramArray[5] = this._unit.custom.parameterArray.lck;
				}
				if (typeof this._unit.custom.parameterArray.def === 'number') {
					paramArray[6] = this._unit.custom.parameterArray.def;
				}
				if (typeof this._unit.custom.parameterArray.res === 'number') {
					paramArray[7] = this._unit.custom.parameterArray.res;
				}
				if (typeof this._unit.custom.parameterArray.mov === 'number') {
					paramArray[8] = this._unit.custom.parameterArray.mov;
				}
				if (typeof this._unit.custom.parameterArray.wlv === 'number') {
					paramArray[9] = this._unit.custom.parameterArray.wlv;
				}
				if (typeof this._unit.custom.parameterArray.bld === 'number') {
					paramArray[10] = this._unit.custom.parameterArray.bld;
				}
				for (i = 0; i < count; i++) {
					param.setAssistValue(i, paramArray[i]);
				}
				if (this._skipCheck) {
					return paramArray;
				} else {
					return param;
                }
				
			}
		}
	);

	RealExperienceFlowEntry._completeMemberData = function (coreAttack) {
		// Don't continue if the battle is not a real type.
		if (!coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}

		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		this._skipLevelUp = false;
		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		if (typeof this._unit.custom.classChangeLevel === "object" && this._unit.custom.classChangeLevel.level === this._unit.getLv()) {
			this._skipLevelUp = true;
			this._unit.setLv(1);
			this._unit.custom.classChangeLevel.reachedLevel = true;
		}
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// Immediately give the exp when skip.
			this._doEndAction();
			return EnterResult.NOTENTER;
		}

		this.changeCycleMode(RealExperienceMode.WINDOW);

		return EnterResult.OK;
	}

	RealExperienceFlowEntry._doEndAction = function () {
		if (this._growthArray !== null && this._skipLevelUp === false) {
			ExperienceControl.plusGrowth(this._unit, this._growthArray);
			ExperienceControl.obtainData(this._unit);
		}
	};

	RealExperienceFlowEntry._moveAnime = function () {
		var levelupViewParam;

		if (this._effect.isEffectLast()) {
			if (this._skipLevelUp === false) {
				levelupViewParam = this._createLevelupViewParam();
				this._levelupView.enterLevelupViewCycle(levelupViewParam);
				this.changeCycleMode(RealExperienceMode.LEVEL);
			} else if (this._skipLevelUp === true) {
				return MoveResult.END;
            }

		}
		return MoveResult.CONTINUE;
	};

	EasyExperienceFlowEntry._completeMemberData = function (coreAttack) {
		// Don't continue if the battle is not a real type.
		if (coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}

		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		this._skipLevelUp = false;
		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		if (typeof this._unit.custom.classChangeLevel === "object" && this._unit.custom.classChangeLevel.level === this._unit.getLv()) {
			this._skipLevelUp = true;
			this._unit.setLv(1);
			this._unit.custom.classChangeLevel.reachedLevel = true;
		}

		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// Immediately give the exp when skip.
			this._doEndAction();
			return EnterResult.NOTENTER;
		}

		this.changeCycleMode(EasyExperienceMode.WINDOW);

		return EnterResult.OK;
	}

	EasyExperienceFlowEntry._doEndAction = function () {
		if (this._growthArray !== null && this._skipLevelUp === false) {
			ExperienceControl.plusGrowth(this._unit, this._growthArray);
			ExperienceControl.obtainData(this._unit);
		}
	}

	EasyExperienceFlowEntry._moveWindow = function () {
		var levelupViewParam;

		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			if (this._growthArray !== null && this._skipLevelUp === false) {
				levelupViewParam = this._createLevelupViewParam();
				this._levelupView.enterLevelupViewCycle(levelupViewParam);

				this.changeCycleMode(EasyExperienceMode.LEVEL);
			}
			else {
				return MoveResult.END;
			}
		}

		return MoveResult.CONTINUE;
	};

	RestrictedLevelupObject._moveTop = function () {
		var levelupViewParam;
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			this._growthArray = RestrictedExperienceControl.obtainExperience(this._targetUnit, this._exp);
			if (this._growthArray === null) {
				return MoveResult.END;
			}
			if (typeof this._targetUnit.custom.classChangeLevel !== 'undefined' && this._targetUnit.getLv() === this._targetUnit.custom.classChangeLevel.level) {
				this._targetUnit.setLv(1);
				var generator = root.getEventGenerator();
				var list = root.getBaseData().getClassList();
				var cls = list.getDataFromId(this._targetUnit.custom.classChangeLevel.classId);
				generator.classChange(this._targetUnit, cls, skipBonusClassAnime);
				if (customBonusClassChangeAnime) {
					var list = root.getBaseData().getEffectAnimationList(false);
					var anim = list.getDataFromId(customBonusClassChangeAnimeId);
					generator.animationPlay(anim, 432, 235, true, AnimePlayType.SYNC, 2);
                }
				this._setParameterEvent(this._targetUnit, generator);
				generator.execute();
				this._growthArray = null;
				this._targetUnit.custom.classChangeLevel.reachedLevel = false;
				this._targetUnit.custom.classChangeLevel.level = 0;
				return MoveResult.END;
			}



			levelupViewParam = this._createLevelupViewParam();
			this._levelupView.enterLevelupViewCycle(levelupViewParam);

			this.changeCycleMode(RestrictedLevelupObjectMode.LEVEL);
		}

		return MoveResult.CONTINUE;
	};

	RestrictedLevelupObject._setParameterEvent = function (unit, generator) {

		var objectgen = root.getObjectGenerator();
		var dummyunit = objectgen.generateUnitFromBaseUnit(unit);
		var parameter = dummyunit.getGrowthBonus();
		dummyunit.setAliveState(AliveType.ERASE);
		var addStats = false;
		if (typeof unit.custom.classChangeLevel.addStats === 'boolean') {
			addStats = unit.custom.classChangeLevel.addStats;
		}
		if (addStats) {
			parameter = this._createParameter(parameter);
		}
		generator.parameterChange(this._targetUnit, parameter, skipParameterChange);

	};
	RestrictedLevelupObject._createParameter = function (parameter) {
		var paramArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var count = ParamGroup.getParameterCount();
		var param = parameter;

		if (typeof this._targetUnit.custom.parameterArray === 'undefined') {
			return param;
		}

		if (typeof this._targetUnit.custom.parameterArray.hp === 'number') {
			paramArray[0] = this._targetUnit.custom.parameterArray.hp;
		}
		if (typeof this._targetUnit.custom.parameterArray.str === 'number') {
			paramArray[1] = this._targetUnit.custom.parameterArray.str;
		}
		if (typeof this._targetUnit.custom.parameterArray.mag === 'number') {
			paramArray[2] = this._targetUnit.custom.parameterArray.mag;
		}
		if (typeof this._targetUnit.custom.parameterArray.skl === 'number') {
			paramArray[3] = this._targetUnit.custom.parameterArray.skl;
		}
		if (typeof this._targetUnit.custom.parameterArray.spd === 'number') {
			paramArray[4] = this._targetUnit.custom.parameterArray.spd;
		}
		if (typeof this._targetUnit.custom.parameterArray.lck === 'number') {
			paramArray[5] = this._targetUnit.custom.parameterArray.lck;
		}
		if (typeof this._targetUnit.custom.parameterArray.def === 'number') {
			paramArray[6] = this._targetUnit.custom.parameterArray.def;
		}
		if (typeof this._targetUnit.custom.parameterArray.res === 'number') {
			paramArray[7] = this._targetUnit.custom.parameterArray.res;
		}
		if (typeof this._targetUnit.custom.parameterArray.mov === 'number') {
			paramArray[8] = this._targetUnit.custom.parameterArray.mov;
		}
		if (typeof this._targetUnit.custom.parameterArray.wlv === 'number') {
			paramArray[9] = this._targetUnit.custom.parameterArray.wlv;
		}
		if (typeof this._targetUnit.custom.parameterArray.bld === 'number') {
			paramArray[10] = this._targetUnit.custom.parameterArray.bld;
		}
		for (i = 0; i < count; i++) {
			param.setAssistValue(i, paramArray[i]);
		}

		return param;
	};

	var NL_LevelUp01 = AttackFlow._pushFlowEntriesEnd;
	AttackFlow._pushFlowEntriesEnd = function (straightFlow) {
		NL_LevelUp01.call(this, straightFlow);
		straightFlow.pushFlowEntry(ClassChangeLevelUpFlowEntry);
		straightFlow.pushFlowEntry(ClassChangeLevelUpParamFlowEntry);
	};

})();