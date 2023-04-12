/**
 * 
 * Plugin to overhaul how the Turns work.
 * This Plugin splits the factions into Squads with a Commander.
 * A commander activates their Squad with a prompt. That Squad then can move and attack.
 * A Squad cannot be activated again until all Squads of a Faction (Faction aka the Player or the Enemy) have taken an action.
 * Effects which happen once a turn usually happen once the Player Faction went through all their commanders. 
 * (In the case that the enemy has more Commanders than the player, it will still be measured by the Player Commanders).
 * 
 * The Refresh Skill (Dance in FE) only works on SquadMembers and the in Engine support also only works on Squad Members.
 * 
 * This Plugin also features 2 commands in the battle prep screen to swap who is a commander and assign units to an commander.
 * 
 * 
 * To use this: The units which are to be commanders need a custom Parameter called {isCommander: 1}.
 * The units in that Commanders Squad need a custom Parameter called {commanderId: 0} where the number indicates to which commander they belong.
 * In this case the unit with the Id 0 would be their commander.
 * 
 * The same applies for enemies with an added optional parameter on the commander to make them act in a certain order.
 * 
 * {isCommander:1, commanderOrder:2}
 * 
 * This would make this commander act when all other commanders with a lower commanderOrder number have acted.
 * 
 * 
 * This is quite a complex Plugin and I didnt have time to test everything so if you find bugs feel free to message me on discord
 * Ceylie#5135
 * 
 * 
 * */

var MAXUNITSPERCOMMANDER = 10;

var MINUNITSPERCOMMANDER = 3;

var COMMANDERDEATHACTION = 2 //Decides what should happen when a commander dies. 0 = whole squad gets erased
                             //1 state is applied(new commander appointed), 2 whole squad takes damage(new commander appointed).

var COMMANDERDEATHSTATEID = 0; //ID of the state to be applied
var COMMANDERDEATHDAMAGE = 5; //Damage to be applied to squad units.

var MarshalBaseMode = {
    UNITSELECT: 0,
    SCREEN: 1,
    UNITSELECT2: 2,
    INFO: 3,
    QUESTION: 4
};

var DrawRightWindowChecker = {
    _drawRightWindow: true
};

var ActivateCommanderMode = {
    QUESTION: 0,
    SELECTION: 1
};

var CommanderList = {
    _turnCycleComplete: false,

    //Gets the list of Commanders for the current turn. Only usable on the map.
    getCommanderList: function () {
        var i, unit, commanderList;
        var arr = [];
        var list = TurnControl.getActorList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander === 1) {
                arr.push(unit);
                root.log(unit.getName());
            }
        }

        commanderList = StructureBuilder.buildDataList();
        commanderList.setDataArray(arr);
        return commanderList;
    },
    //Gets the list of commanders sortied right now. Used for Battle Preperation screens.
    getCommanderSortieList: function () {
        var i, unit, commanderList;
        var arr = [];
        var list = PlayerList.getSortieList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander === 1) {
                arr.push(unit);
            }
        }

        commanderList = StructureBuilder.buildDataList();
        commanderList.setDataArray(arr);
        return commanderList;
    },
    //Gets the list of commanders sortied right now and who are not the commander of the selected unit.
    getCommanderMatchSortieList: function (commanderId) {
        var i, unit, commanderList;
        var arr = [];
        var list = PlayerList.getSortieList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander === 1 && unit.getBaseId() !== commanderId) {
                arr.push(unit);
            }
        }

        commanderList = StructureBuilder.buildDataList();
        commanderList.setDataArray(arr);
        return commanderList;
    },

    //Gets the list of all sortied non commander units.
    getNonCommanderSortieList: function () {
        var i, unit, commanderList;
        var arr = [];
        var list = PlayerList.getSortieList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander !== 1) {
                arr.push(unit);
            }
        }

        commanderList = StructureBuilder.buildDataList();
        commanderList.setDataArray(arr);
        return commanderList;
    },

    //Gets the list of squad members of a commander. Only usable on the map.
    getSquadMemberList: function (commanderId) {
        var i, unit, squadList;
        var arr = [];
        var list = TurnControl.getActorList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.commanderId === commanderId) {
                arr.push(unit);
            }
        }
        squadList = StructureBuilder.buildDataList();
        squadList.setDataArray(arr);
        return squadList;
    },
    //Gets the list of squad members of a commander. Used for the Battle Preperation screens.
    getSquadMemberSortieList: function (commanderId) {
        var i, unit, squadList;
        var arr = [];
        var list = PlayerList.getSortieList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.commanderId === commanderId) {
                arr.push(unit);
            }
        }
        squadList = StructureBuilder.buildDataList();
        squadList.setDataArray(arr);
        return squadList;
    },
    //Gets the list of all active Units. Will only return something if the activate Squad has already happened or before the turn ended and everything reset.
    getActiveSquadList: function () {
        var i, unit, squadList;
        var arr = [];
        var list = TurnControl.getActorList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isActive === 1) {
                arr.push(unit);
            }
        }
        squadList = StructureBuilder.buildDataList();
        squadList.setDataArray(arr);
        return squadList;
    },

    getUseableCommanderList: function () {
        var i, unit, commanderList;
        var arr = [];
        var list = TurnControl.getActorList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander === 1 && unit.custom.hadTurn === 0) {
                arr.push(unit);
            }
        }

        commanderList = StructureBuilder.buildDataList();
        commanderList.setDataArray(arr);
        return commanderList;
    },
    //Method to mark that the current active squad + commander had their turn, set them not active and checks if every commander had a turn already.
    setActiveSquadHadTurn: function () {
        var i, unit;
        var list = CommanderList.getActiveSquadList();
        var count = list.getCount();
        if (count === 0) {
            list = CommanderList.getUseableCommanderList();
            if (list.getCount() === 0) {
                CommanderList._resetCommanders();
                return;
            }
            var randomUnit = Math.floor(Math.random() * list.getCount());
            unit = list.getData(randomUnit);
            unit.custom.hadTurn = 1;
        }
        else {
            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                root.log(unit.getName());
                if (unit.custom.isActive === 1) {
                    if (unit.custom.isCommander === 1) {
                        unit.custom.hadTurn = 1;
                    }
                    unit.custom.isActive = 0;
                }
            }
        }
        CommanderList._resetCommanders();
    },
    //Method to initiate the map.
    setMapStartParameters: function () {
        var list = PlayerList.getSortieList();
        this._setStartingParameters(list);
        list = EnemyList.getAliveList();
        this._setStartingParameters(list);
        list = AllyList.getAliveList();
        this._setStartingParameters(list);
    },

    //Method which activates a squad, removes wait and sets them active.
    activateSquad: function (unit) {
        var commanderId = unit.getBaseId();
        var squadList = CommanderList.getSquadMemberList(commanderId);
        var i, squadUnit;
        var count = squadList.getCount();

        for (i = 0; i < count; i++) {
            squadUnit = squadList.getData(i);
            squadUnit.custom.isActive = 1;
            this._removeWaitState(squadUnit);
        }
        unit.custom.isActive = 1;
        CommanderList._setWaitForCommanders(commanderId);
    },

    _removeWaitState: function (unit) {
        var reactionTurnCount = unit.getReactionTurnCount();

        if (reactionTurnCount > 0) {
            unit.setReactionTurnCount(reactionTurnCount - 1);
        }

        unit.setWait(false);
    },

    //Method which sets the other commanders to wait state to be more clear that they cant be activated and are not active.
    _setWaitForCommanders: function (commanderId) {
        var i, unit;
        var list = CommanderList.getCommanderList();
        var count = list.getCount();

        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.getBaseId() !== commanderId) {
                unit.setWait(true);
            }
        }
    },

    _resetCommanders: function () {
        var i, unit;
        var commanderCount = 0;
        var list = CommanderList.getCommanderList();
        var count = list.getCount();
        
        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.hadTurn === 1) {
              root.log(unit.getName());
                commanderCount++;
            }
        }
        if (commanderCount === count && count != 0) {
            if (root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
              root.log("reset");
                this._turnCycleComplete = true;
            }
            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                unit.custom.hadTurn = 0;
            }

        }
    },
    //Method to set the starting parameters, sets wait to all units but commanders and resets hadturn.
    _setStartingParameters: function (list) {
        var count = list.getCount();
        var i, unit;
        for (i = 0; i < count; i++) {
            unit = list.getData(i);
            if (unit.custom.isCommander !== 1) {
                unit.setWait(true);
            } else {
                unit.custom.hadTurn = 0;
            }
            if (typeof unit.custom.commanderId === 'number') {
              commander = CommanderList._getUnitFromId(list, unit.custom.commanderId);
              if (typeof commander.custom.isCommander !== 'number' || commander.custom.isCommander !== 1) {
                var squadList = CommanderList.getCommanderList();
                unit.custom.commanderId = squadList.getData(0).getBaseId();
              }
              
            } else {
                if (unit.custom.isCommander !== 1) {
                var squadList = CommanderList.getCommanderList();
                unit.custom.commanderId = squadList.getData(0).getBaseId();
                }
            }
            

            unit.custom.isActive = 0;
        }
    },
    _getUnitFromId: function (list, id) {
      var i, unit;
      var count = list.getCount();
      for(i = 0; i < count; i++) {
        unit = list.getData(i);
        if (unit.getBaseId() === id) {
          return unit;
        }
      }
    }
};


MarshalCommand.CommanderSelect = defineObject(MarshalBaseCommand,
    {
        _unitSelectWindow2: null,
        _unitSelected: false,
        _drawUnitWindow2: false,
        _infoWindow: null,
        _unit1: null,
        _unit2: null,

        setUnitSelectWindow: function (unitSelectWindow) {
            this._unitSelectWindow = unitSelectWindow;
            this._unitSelectWindow2 = this._parentMarshalScreen._unitSelectWindow2;
            this._infoWindow = createWindowObject(InfoWindow, this);
        },

        openCommand: function () {
            this._unitSelectWindow.setActive(true);
            this._unitSelectWindow.updateUnitList(CommanderList.getNonCommanderSortieList());
            this._unitSelectWindow.setSingleMode();
            this._unitSelectWindow2.setSingleMode();

        },

        moveCommand: function () {
            var result = MoveResult.CONTINUE;
            var mode = this.getCycleMode();

            if (mode === MarshalBaseMode.UNITSELECT) {
                result = this._moveUnitSelect();
            }
            else if (mode === MarshalBaseMode.SCREEN) {
                result = this._moveScreen();
            }
            else if (mode === MarshalBaseMode.UNITSELECT2) {
                result = this._moveUnitSelect2();
            }
            else if (mode === MarshalBaseMode.INFO) {
                result = this._moveInfo();
            }

            return result;
        },
        _closeCommand: function () {
            this._unitSelectWindow2.setActive(false);
            DrawRightWindowChecker._drawRightWindow = true;
            this._unitSelected = false;
            this._drawUnitWindow2 = false;
            this._unitSelectWindow.updateUnitList(PlayerList.getAliveList());
            this._unit1 = null;
            this._unit2 = null;
            this.changeCycleMode(MarshalBaseMode.UNITSELECT);
        },

        checkCommand: function () {
            var index;
            var unit = this._unitSelectWindow.getFirstUnit();

            if (unit === null) {
                this._closeCommand();
                return false;
            }
            this._unit1 = unit;
            index = this._unitSelectWindow.getUnitSelectIndex();
            this._unitSelectWindow.resetSelectUnit();
            this._unitSelectWindow.updateUnitList(PlayerList.getAliveList());
            this._unitSelectWindow.setUnitSelectIndex(index);
            return true;
        },

        checkCommand2: function () {
            var index, list;
            var unit = this._unitSelectWindow2.getFirstUnit();
            if (unit === null) {
                this._closeCommand();
                return false;
            }
            this._unit2 = unit;
            list = CommanderList.getSquadMemberSortieList(unit.getBaseId());
            if (list.getCount() > MAXUNITSPERCOMMANDER) {
                this._unitSelectWindow2.resetSelectUnit();
                this._unitSelectWindow2.updateUnitList(PlayerList.getAliveList());
                this._unitSelectWindow2.setUnitSelectIndex(index);
                this._infoWindow.setInfoMessage("Commanders can only have " + MAXUNITSPERCOMMANDER + "units");
                return true
            }
            this._unit1.custom.commanderId = this._unit2.getBaseId();
            this._infoWindow.setInfoMessage("Assigned " + this._unit1.getName() + " to " + this._unit2.getName());
            index = this._unitSelectWindow.getUnitSelectIndex();
            this._unitSelectWindow2.resetSelectUnit();
            this._unitSelectWindow2.updateUnitList(PlayerList.getAliveList());
            this._unitSelectWindow2.setUnitSelectIndex(index);

            return true;
        },

        drawCommand: function () {
            var mode = this.getCycleMode();
            if (mode === MarshalBaseMode.UNITSELECT2) {
                this._parentMarshalScreen._drawRightWindow2();
            }
            else if (mode === MarshalBaseMode.INFO) {
                this._infoWindow.drawWindow(200, 200);
            }
        },

        isMarshalScreenCloesed: function () {
            return true;
        },

        getInfoWindowType: function () {
            return MarshalInfoWindowType.UNIT;
        },

        getCommandName: function () {
            return 'Assign Unit';
        },

        getMarshalDescription: function () {
            return StringTable.Marshal_UnitSort;
        },

        _moveUnitSelect: function () {
            var result = this._unitSelectWindow.moveWindow();

            if (this._unitSelectWindow.getRecentlyInputType() !== InputType.NONE) {
                this._parentMarshalScreen.updateSubWindow();

            }

            if (result !== MoveResult.CONTINUE) {
                if (this.checkCommand()) {
                    this._unitSelected = true;
                    this._unitSelectWindow.setActive(false);
                    this._unitSelectWindow2.setActive(true);
                    this._drawUnitWindow2 = true;
                    DrawRightWindowChecker._drawRightWindow = false;
                    this._unitSelectWindow2.updateUnitList(CommanderList.getCommanderMatchSortieList(this._unit1.custom.commanderId));
                    this.changeCycleMode(MarshalBaseMode.UNITSELECT2);
                    result = MoveResult.CONTINUE;

                }
            }
            return result;
        },

        _moveUnitSelect2: function () {
            var result = this._unitSelectWindow2.moveWindow();
            if (this._unitSelectWindow.getRecentlyInputType() !== InputType.NONE) {
                this._parentMarshalScreen.updateSubWindow();
            }

            if (result !== MoveResult.CONTINUE) {
                if (this.checkCommand2()) {
                    this._unitSelected = false;
                    this._drawUnitWindow2 = false;
                    this.changeCycleMode(MarshalBaseMode.INFO);
                    result = MoveResult.CONTINUE;
                }
            }
            return result;
        },

        _moveInfo: function () {
            var result = this._infoWindow.moveWindow();

            if (result !== MoveResult.CONTINUE) {
                this.changeCycleMode(MarshalBaseMode.UNITSELECT);
                this._closeCommand();
            }
            return result;

        }
    }
);

MarshalCommand.CommanderAssign = defineObject(MarshalBaseCommand,
    {
        _infoWindow: null,
        _questionWindow: null,
        _unit: null,

        setUnitSelectWindow: function (unitSelectWindow) {
            this._unitSelectWindow = unitSelectWindow;
            this._infoWindow = createWindowObject(InfoWindow, this);
            this._questionWindow = createWindowObject(QuestionWindow, this)
        },

        openCommand: function () {
            this._unitSelectWindow.setActive(true);
            this._unitSelectWindow.updateUnitList(PlayerList.getSortieList());
            this._unitSelectWindow.setSingleMode();

        },

        moveCommand: function () {
            var result = MoveResult.CONTINUE;
            var mode = this.getCycleMode();

            if (mode === MarshalBaseMode.UNITSELECT) {
                result = this._moveUnitSelect();
            }
            else if (mode === MarshalBaseMode.SCREEN) {
                result = this._moveScreen();
            }
            else if (mode === MarshalBaseMode.INFO) {
                result = this._moveInfo();
            }
            else if (mode === MarshalBaseMode.QUESTION) {
                result = this._moveQuestion();
            }

            return result;
        },
        _closeCommand: function () {
            this._unitSelected = false;
            this._unitSelectWindow.updateUnitList(PlayerList.getAliveList());
            this.changeCycleMode(MarshalBaseMode.UNITSELECT);
        },

        checkCommand: function () {
            var index;
            var unit = this._unitSelectWindow.getFirstUnit();

            if (unit === null) {
                this._closeCommand();
                return false;
            }
            this._unit = unit;
            if (unit.custom.isCommander === 1) {
                this._questionWindow.setQuestionMessage("Demote " + unit.getName() + " ?");
            }
            else {
                this._questionWindow.setQuestionMessage("Promote " + unit.getName() + " ?");
            }
            index = this._unitSelectWindow.getUnitSelectIndex();
            this._unitSelectWindow.resetSelectUnit();
            this._unitSelectWindow.setUnitSelectIndex(index);
            return true;
        },

        drawCommand: function () {
            var mode = this.getCycleMode();
            if (mode === MarshalBaseMode.INFO) {
                this._infoWindow.drawWindow(200, 200);
            }
            else if (mode === MarshalBaseMode.QUESTION) {
                this._questionWindow.drawWindow(200, 200);
            }
        },

        isMarshalScreenCloesed: function () {
            return true;
        },

        getInfoWindowType: function () {
            return MarshalInfoWindowType.UNIT;
        },

        getCommandName: function () {
            return 'Assign Commander';
        },

        getMarshalDescription: function () {
            return StringTable.Marshal_UnitSort;
        },

        _moveUnitSelect: function () {
            var result = this._unitSelectWindow.moveWindow();

            if (this._unitSelectWindow.getRecentlyInputType() !== InputType.NONE) {
                this._parentMarshalScreen.updateSubWindow();

            }

            if (result !== MoveResult.CONTINUE) {
                if (this.checkCommand()) {
                    this._unitSelectWindow.setActive(false);
                    this.changeCycleMode(MarshalBaseMode.QUESTION);
                    result = MoveResult.CONTINUE;

                }
                else {
                    this._closeCommand();
                }
            }
            return result;
        },

        _moveInfo: function () {
            var result = this._infoWindow.moveWindow();

            if (result !== MoveResult.CONTINUE) {
                this.changeCycleMode(MarshalBaseMode.UNITSELECT);
                this._closeCommand();
            }
            return result;

        },

        _moveQuestion: function () {
            var result = this._questionWindow.moveWindow();

            if (result !== MoveResult.CONTINUE) {
                if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
                    if (this._unit.custom.isCommander === 1) {
                        this._removeCommander();
                    }
                    else if (this._commanderLimit()) {
                        this._unit.custom.isCommander = 1;
                        this._unit.custom.commanderId = null;
                        this._infoWindow.setInfoMessage("Promoted " + this._unit.getName() + " to Commander");
                    }
                    this.changeCycleMode(MarshalBaseMode.INFO);
                    result = MoveResult.CONTINUE;
                }
                else {
                    this.changeCycleMode(MarshalBaseMode.UNITSELECT);
                    this._unitSelectWindow.setActive(true);
                    result = MoveResult.CONTINUE;
                }

            }
            return result;
        },

        _commanderLimit: function () {
            var playerCount = PlayerList.getAliveList().getCount();
            var commanderCount = CommanderList.getCommanderSortieList().getCount();
            if (playerCount <= MINUNITSPERCOMMANDER && commanderCount < 1) {
                return true;
            }
            else if ((commanderCount * MINUNITSPERCOMMANDER) < (playerCount - commanderCount)) {
                return true;
            }
            this._infoWindow.setInfoMessage("Can't have more Commanders");
            return false;

        },

        _removeCommander: function () {
            var list, count, commanderCount, i, unit;
            list = CommanderList.getSquadMemberSortieList(this._unit.getBaseId());
            count = list.getCount();
            commanderCount = CommanderList.getCommanderSortieList().getCount();
            if (commanderCount === 1) {
                this._infoWindow.setInfoMessage("Can't remove your last Commander");
                return;
            }

            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                unit.custom.commanderId = null;
            }

            this._unit.custom.isCommander = 0;
            this._infoWindow.setInfoMessage("Demoted " + this._unit.getName() + " from Commander");
        }
    }
);

var NL_Squad01 = MarshalCommandWindow._configureMarshalItem;
MarshalCommandWindow._configureMarshalItem = function (groupArray) {
    groupArray.appendObject(MarshalCommand.CommanderSelect);
    groupArray.appendObject(MarshalCommand.CommanderAssign);
    NL_Squad01.call(this, groupArray);
};

TurnChangeStart.pushFlowEntries = function (straightFlow) {

    if (this._isTurnAnimeEnabled()) {
        straightFlow.pushFlowEntry(TurnAnimeFlowEntry);
    }
    else {
        straightFlow.pushFlowEntry(TurnMarkFlowEntry);
    }

    if (CommanderList._turnCycleComplete && root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
        CommanderList._turnCycleComplete = false;
        straightFlow.pushFlowEntry(StateTurnFlowEntry);
    }
};

MarshalScreen._unitSelectWindow2 = null;

MarshalScreen.drawScreenCycle = function () {
    var object;
    var mode = this.getCycleMode();

    this._drawLeftWindow();
    if (DrawRightWindowChecker._drawRightWindow) {
        this._drawRightWindow();
    }
    if (mode === MarshalScreenMode.OPEN) {
        object = this._marshalCommandWindow.getObject();
        object.drawCommand();

        this._drawSubWindow();
    }

};
var NL_Squad02 = MarshalScreen._prepareScreenMemberData;
MarshalScreen._prepareScreenMemberData = function (screenParam) {
    NL_Squad02.call(this, screenParam);
    this._unitSelectWindow2 = createWindowObject(UnitSelectWindow, this);
};

var NL_Squad03 = MarshalScreen._completeScreenMemberData;

MarshalScreen._completeScreenMemberData = function (screenParam) {
    NL_Squad03.call(this, screenParam);
    this._unitSelectWindow2.setInitialList(CommanderList.getCommanderSortieList());
};

MarshalScreen._drawRightWindow2 = function () {
    var width = this._marshalCommandWindow.getWindowWidth() + this._unitSelectWindow.getWindowWidth();
    var x = LayoutControl.getCenterX(-1, width);
    var y = this._getStartY();

    x += this._marshalCommandWindow.getWindowWidth();
    this._unitSelectWindow2.drawWindow(x, y);
};

var NL_Squad04 = TurnChangeMapStart.doLastAction;

TurnChangeMapStart.doLastAction = function () {
    NL_Squad04.call(this);
    CommanderList.setMapStartParameters();
};

TurnChangeEnd._checkActorList = function () {
    var i, unit;
    var list = TurnControl.getActorList();
    var count = list.getCount();

    for (i = 0; i < count; i++) {
        unit = list.getData(i);
        if (unit.custom.isCommander === 1 && unit.custom.hadTurn === 0) { //
            this._removeWaitState(unit);
        }
        else {
            unit.setWait(true);
        }
        unit = FusionControl.getFusionChild(unit);
        if (unit !== null) {
            // Deactivate a wait state of the units who are fused.
            this._removeWaitState(unit);
        }
    }
};

var NL_Squad05 = TurnChangeEnd._startNextTurn;
TurnChangeEnd._startNextTurn = function () {
    CommanderList.setActiveSquadHadTurn();
    NL_Squad05.call(this);
    CommanderList._resetCommanders();
}

PlayerTurn._questionWindow = null;
PlayerTurn._straightFlow = null;

var NL_Squad06 = PlayerTurn.moveTurnCycle;

PlayerTurn.moveTurnCycle = function () {
    var mode = this.getCycleMode();
    var result = MoveResult.CONTINUE;

    result = NL_Squad06.call(this);
    if (mode === PlayerTurnMode.QUESTION) {
        result = this._moveQuestion();
    }

    if (this._checkAutoTurnEnd()) {
        return MoveResult.CONTINUE;
    }

    return result;
};

var NL_Squad07 = PlayerTurn.drawTurnCycle;
PlayerTurn.drawTurnCycle = function () {
    var mode = this.getCycleMode();
    NL_Squad07.call(this);
    if (mode === PlayerTurnMode.QUESTION) {
        this._drawQuestion();
    }
};

var NL_Squad08 = PlayerTurn._prepareTurnMemberData;

PlayerTurn._prepareTurnMemberData = function () {
    this._questionWindow = createObject(QuestionWindow);
    this._straightFlow = createObject(StraightFlow);
    NL_Squad08.call(this);
};

var NL_Squad09 = PlayerTurn._completeTurnMemberData;

PlayerTurn._completeTurnMemberData = function () {
    this._setQuestionData();
    this._straightFlow.setStraightFlowData(this);
    NL_Squad09.call(this);
};

PlayerTurn._moveMap = function () {
    var result = this._mapEdit.moveMapEdit();

    if (result === MapEditResult.UNITSELECT) {
        this._targetUnit = this._mapEdit.getEditTarget();
        if (this._targetUnit !== null) {
            if (this._targetUnit.isWait()) {
                this._mapEdit.clearRange();

                // Pressing the decision key on the unit who waits is treated as a map command.
                this._mapCommandManager.openListCommandManager();
                this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
            }
            else {
                if (this._targetUnit.custom.isCommander === 1 && this._targetUnit.custom.isActive === 0 && this._targetUnit.getUnitGroup() === UnitGroup.PLAYER) { //
                    this._mapEdit.clearRange();
                    this.changeCycleMode(PlayerTurnMode.QUESTION);
                    return MoveResult.CONTINUE;
                } //
                // Change it to the mode which displaying the unit moving range.
                this._mapSequenceArea.openSequence(this);
                this.changeCycleMode(PlayerTurnMode.AREA);
            }
        }
    }
    else if (result === MapEditResult.MAPCHIPSELECT) {
        this._mapCommandManager.openListCommandManager();
        this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
    }

    return MoveResult.CONTINUE;
};

PlayerTurn._moveQuestion = function () {
    var result = MoveResult.CONTINUE;

    if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
        if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
            CommanderList.activateSquad(this._targetUnit);
            this._pushFlowEntries(this._straightFlow);
            this._straightFlow.enterStraightFlow();
            this.changeCycleMode(PlayerTurnMode.MAP)
            return MoveResult.CONTINUE;
        }
        else {
            this.changeCycleMode(PlayerTurnMode.MAP)
            return MoveResult.CONTINUE;
        }
    }

    return result;
};

PlayerTurn._setQuestionData = function () {
    this._questionWindow = createWindowObject(QuestionWindow, this);
    this._questionWindow.setQuestionMessage("Activate this Squad?");
    this._questionWindow.setQuestionActive(true);
    this.changeCycleMode(ActivateCommanderMode.QUESTION);
};

PlayerTurn._drawQuestion = function () {
    MapLayer.drawUnitLayer();
    var width = this._questionWindow.getWindowWidth();
    var height = this._questionWindow.getWindowHeight();
    var x = LayoutControl.getCenterX(-1, width);
    var y = LayoutControl.getCenterY(-1, height);

    this._questionWindow.drawWindow(x, y);
};

PlayerTurn._pushFlowEntries = function (straightFlow) {
    straightFlow.pushFlowEntry(RecoveryActiveFlowEntry);
    straightFlow.pushFlowEntry(MetamorphozeCancelActiveFlowEntry);
    straightFlow.pushFlowEntry(BerserkActiveFlowEntry);
};


var NL_Squad10 = EnemyTurn.openTurnCycle;

EnemyTurn.openTurnCycle = function() {
  
  NL_Squad10.call(this);
  var list = CommanderList.getUseableCommanderList();
  if (list.getCount() > 0) {
    this.activateCommander(list);
  }
}

EnemyTurn.activateCommander = function (commanderList) {
  var i, unit, savedUnit;
  var id = null;
  var lowestOrder = 10;
  var count = commanderList.getCount();
  
  for (i = 0; i < count; i++) {
    unit = commanderList.getData(i);
    if (unit.custom.commanderOrder != null && unit.custom.commanderOrder < lowestOrder) {
      id = unit.getBaseId();
      savedUnit = unit;
      lowestOrder = unit.custom.commanderOrder;
    } else if (id == null) {
      id = unit.getBaseId();
      savedUnit = unit;
       
    }


  }
    CommanderList.activateSquad(savedUnit);
};

var NL_Squad11 = PreAttack._pushFlowEntriesEnd;

PreAttack._pushFlowEntriesEnd = function (straightFlow) {
    NL_Squad11.call(this, straightFlow);
    straightFlow.pushFlowEntry(CommanderDeathFlowEntry);
}


//Super simple adjustment of the standard flow entries. Just changed the unit list to make it only target the activated squad.
var RecoveryActiveFlowEntry = defineObject(BaseFlowEntry,
    {
        _dynamicEvent: null,

        enterFlowEntry: function (turnChange) {
            this._prepareMemberData(turnChange);
            return this._completeMemberData(turnChange);
        },

        moveFlowEntry: function () {
            return this._dynamicEvent.moveDynamicEvent();
        },

        _prepareMemberData: function (turnChange) {
            this._dynamicEvent = createObject(DynamicEvent);
        },

        _completeMemberData: function (turnChange) {
            var i, unit, recoveryValue;
            var commandCount = 0;
            var isSkipMode = CurrentMap.isTurnSkipMode();
            var generator = this._dynamicEvent.acquireEventGenerator();
            var list = CommanderList.getActiveSquadList();
            var count = list.getCount();

            for (i = 0; i < count; i++) {
                unit = list.getData(i);

                recoveryValue = this._getRecoveryValue(unit);
                if (recoveryValue > 0) {
                    // Recover if HP is reduced.
                    if (unit.getHp() < ParamBonus.getMhp(unit)) {
                        // Cursor display is always skipped by specifying true.
                        generator.locationFocus(unit.getMapX(), unit.getMapY(), true);
                        generator.hpRecovery(unit, this._getTurnRecoveryAnime(), recoveryValue, RecoveryType.SPECIFY, isSkipMode);
                        commandCount++;
                    }
                }
                else if (recoveryValue < 0) {
                    generator.locationFocus(unit.getMapX(), unit.getMapY(), true);
                    recoveryValue *= -1;
                    recoveryValue = this._arrangeValue(unit, recoveryValue);
                    generator.damageHit(unit, this._getTurnDamageAnime(), recoveryValue, DamageType.FIXED, {}, isSkipMode);
                    commandCount++;
                }
            }

            if (commandCount === 0) {
                return EnterResult.NOTENTER;
            }

            return this._dynamicEvent.executeDynamicEvent();
        },

        _getRecoveryValue: function (unit) {
            var skill, terrain;
            var recoveryValue = 0;

            skill = SkillControl.getBestPossessionSkill(unit, SkillType.AUTORECOVERY);
            if (skill !== null) {
                recoveryValue += skill.getSkillValue();
            }

            terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
            if (terrain !== null) {
                recoveryValue += terrain.getAutoRecoveryValue();
            }

            recoveryValue += StateControl.getHpValue(unit);

            return recoveryValue;
        },

        _arrangeValue: function (unit, recoveryValue) {
            if (DataConfig.isTurnDamageFinishAllowed()) {
                return recoveryValue;
            }

            if (unit.getHp() - recoveryValue <= 0) {
                recoveryValue = unit.getHp() - 1;
            }

            return recoveryValue;
        },

        _getTurnRecoveryAnime: function () {
            return root.queryAnime('easyrecovery');
        },

        _getTurnDamageAnime: function () {
            return root.queryAnime('easydamage');
        }
    }
);

var MetamorphozeCancelActiveFlowEntry = defineObject(BaseFlowEntry,
    {
        _dynamicEvent: null,

        enterFlowEntry: function (turnChange) {
            this._prepareMemberData(turnChange);
            return this._completeMemberData(turnChange);
        },

        moveFlowEntry: function () {
            return this._dynamicEvent.moveDynamicEvent();
        },

        _prepareMemberData: function (turnChange) {
            this._dynamicEvent = createObject(DynamicEvent);
        },

        _completeMemberData: function (turnChange) {
            var i, unit, turn, metamorphozeData;
            var commandCount = 0;
            var isSkipMode = CurrentMap.isTurnSkipMode();
            var generator = this._dynamicEvent.acquireEventGenerator();
            var list = CommanderList.getActiveSquadList();
            var count = list.getCount();

            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                metamorphozeData = MetamorphozeControl.getMetamorphozeData(unit);
                if (metamorphozeData === null || !(metamorphozeData.getCancelFlag() & MetamorphozeCancelFlag.AUTO)) {
                    continue;
                }

                turn = MetamorphozeControl.getMetamorphozeTurn(unit);
                if (--turn === 0) {
                    generator.locationFocus(unit.getMapX(), unit.getMapY(), true);
                    generator.unitMetamorphoze(unit, {}, MetamorphozeActionType.CANCEL, isSkipMode);
                    // Process if the unit who was deactivated acts first.
                    generator.wait(10);
                    commandCount++;
                }

                MetamorphozeControl.setMetamorphozeTurn(unit, turn);
            }

            if (commandCount === 0) {
                return EnterResult.NOTENTER;
            }

            return this._dynamicEvent.executeDynamicEvent();
        }
    }
);

var BerserkActiveFlowEntry = defineObject(BaseFlowEntry,
    {
        _berserkTurn: null,

        enterFlowEntry: function (turnChange) {
            this._prepareMemberData(turnChange);
            return this._completeMemberData(turnChange);
        },

        moveFlowEntry: function () {
            return this._berserkTurn.moveTurnCycle();
        },

        drawFlowEntry: function () {
            this._berserkTurn.drawTurnCycle();
        },

        _prepareMemberData: function (turnChange) {
            this._berserkTurn = createObject(PlayerBerserkTurn);
        },

        _completeMemberData: function (turnChange) {
            if (!this._isBerserkTurn()) {
                return EnterResult.NOTENTER;
            }

            this._berserkTurn.openTurnCycle();

            return EnterResult.OK;
        },

        _isBerserkTurn: function () {
            var i, unit;
            var list = CommanderList.getActiveSquadList();
            var count = list.getCount();

            if (root.getCurrentSession().getTurnType() !== TurnType.PLAYER) {
                return false;
            }

            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
                    return true;
                }
                else if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
                    return true;
                }
            }

            return false;
        }
    }
);

var CommanderDeathFlowEntry = defineObject(BaseFlowEntry,
    {
        enterFlowEntry: function (preAttack) {
            this._prepareMemberData(preAttack);
            return this._completeMemberData(preAttack);
        },

        moveFlowEntry: function () {
        },

        _prepareMemberData: function (preAttack) {
        },

        _completeMemberData: function (preAttack) {
            var result, isEventStoppable, active;
            var isEventSkip = false;
            var unit = preAttack.getPassiveUnit();
            root.log(unit.getName());
            if (unit.getHp() !== 0 || unit.custom.isCommander !== 1) {
                return EnterResult.NOTENTER;
            }

            if (COMMANDERDEATHACTION === 0) {
                this._eraseSquad(unit);
            } else if (COMMANDERDEATHACTION === 1) {
                this._applyState(unit);
            } else if (COMMANDERDEATHACTION === 2) {
                this._damageSquad(unit);
            }

            return EnterResult.NOTENTER;
        },

        _eraseSquad: function (unit) {
            var list = this._getUnitList(unit);
            var count = list.getCount();
            var i, unit2;

            for (i = 0; i < count; i++) {
                unit2 = list.getData(i);
                unit2.setAliveState(AliveType.ERASE);

            }
        },

        _applyState: function (unit) {
            var list = this._getUnitList(unit);
            var count = list.getCount();
            var i, unit2, savedId;
            var state = root.getBaseData().getStateList().getDataFromId(COMMANDERDEATHSTATEID);

            for (i = 0; i < count; i++) {
                unit2 = list.getData(i);
                if (i === 0) {
                    unit2.custom.isCommander = 1;
                    unit2.custom.commanderId = null;
                    unit2.setWait(false);
                    savedId = unit2.getBaseId();
                } else {
                    unit2.custom.commanderId = savedId;
                }
                StateControl.arrangeState(unit2, state, IncreaseType.INCREASE);

            }
        },
        _damageSquad: function (unit) {
            var list = this._getUnitList(unit);
            var count = list.getCount();
            var i, unit2, savedId, hp;

            for (i = 0; i < count; i++) {
                unit2 = list.getData(i);
                if (i === 0) {
                    unit2.custom.isCommander = 1;
                    unit2.custom.commanderId = null;
                    unit2.setWait(false);
                    savedId = unit2.getBaseId();
                } else {
                    unit2.custom.commanderId = savedId;
                }
                hp = unit2.getHp();
                if (hp - COMMANDERDEATHDAMAGE <= 0) {
                    unit2.setHp(1);
                } else {
                    unit2.setHp(hp - COMMANDERDEATHDAMAGE);
                }

            }
        },
        _getUnitList: function (commanderUnit) {
            var list, unit, squadList;

            if (commanderUnit.getUnitType() === UnitType.PLAYER) {
                list = PlayerList.getSortieList();
            } else if (commanderUnit.getUnitType() === UnitType.ENEMY) {
                list = EnemyList.getAliveList();
            } else {
                list = AllyList.getAliveList();
            }

            var arr = [];
            var count = list.getCount();

            for (i = 0; i < count; i++) {
                unit = list.getData(i);
                if (unit.custom.commanderId === commanderUnit.getBaseId()) {
                    arr.push(unit);
                }
            }
            squadList = StructureBuilder.buildDataList();
            squadList.setDataArray(arr);
            return squadList;
        }

    }
)

var NL_Squad12 = UnitCommand.Quick._isTargetAllowed;

UnitCommand.Quick._isTargetAllowed = function (targetUnit, unit, skill) {
    var value = NL_Squad12.call(this, targetUnit, unit, skill);

    if (targetUnit.custom.isActive != null && targetUnit.custom.isActive !== 1) {
        return false
    }
    return value;
}


SupportCalculator._collectStatus = function(unit, targetUnit, totalStatus) {
    var i, data;
    var count = targetUnit.getSupportDataCount();

    for (i = 0; i < count; i++) {
        data = targetUnit.getSupportData(i);
        if (unit === data.getUnit() && data.isGlobalSwitchOn() && data.isVariableOn()) {
            if (unit.custom.isCommander === 1 && unit.getBaseId() === targetUnit.custom.commanderId) {
                this._addStatus(totalStatus, data.getSupportStatus());
                break;
            } else if (unit.custom.isCommander !== 1 && unit.custom.commanderId === targetUnit.custom.commanderId) {
                this._addStatus(totalStatus, data.getSupportStatus());
                break;
            }
        }
    }
}