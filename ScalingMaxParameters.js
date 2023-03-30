/**
 * Plugin to scale the Maximum of the Parameters
 * This Plugin scales the max Parameters/Stats of all Units
 * by the chosen method. If a Unit changes class with a class change item, this will keep track of the internal level.
 * 
 * The available methods are:
 * 
 * - ADDLEVEL (0) Adds the level of the Unit to the max stat.
 * - MULLEVEL (1) Multiplies the max stat with the level of the unit
 * - MULLEVELWITHCONSTANT (2) Multiplies the level with a constant, then adds that to the max stat.
 * - INCREASEEVERYXLEVEL (3) Increases the max stat by 1 every x level
 * 
 * To select which method you want, set the variable ScaleSelector to the number in the bracket
 * Additionally you can choose to ignore the Max Parameter you set in engine. This will affect every unit.
 * 
 * If you chose to ignore the Engine max parameter you can set a starting max cap for all stats with StartingConstant.
 * 
 * If you chose MULLEVELWITHCONSTANT, you can set the constant you want to multiply the level with by setting MultiplyConstant.
 * 
 * If you chose INCREASEEVERYXLEVEL, the X can be changed with EveryLevelConstant. Default every second level.
 * 
 * */

(function () {

    var ScaleSelector = 3;

    var IgnoreEngineMax = false;

    var StartingConstant = 0;

    var MultiplyConstant = 1;

    var EveryLevelConstant = 2;






    var ScalingSelect = {
        ADDLEVEL: 0,
        MULLEVEL: 1,
        MULLEVELWITHCONSTANT: 2,
        INCREASEEVERYXLEVEL: 3
    };


    var NL_ScalingMaxParameters01 = BaseUnitParameter.getMaxValue;

    BaseUnitParameter.getMaxValue = function (unit) {
        var engineMax = NL_ScalingMaxParameters01.call(this, unit);
        var max = 0;
        var level = unit.getLv();

        if (unit.custom.savedClassChangeLevel != null && typeof unit.custom.savedClassChangeLevel === 'number') {
            level += unit.custom.savedClassChangeLevel;
        }
        if (IgnoreEngineMax) {
            max = StartingConstant;

        } else {
            max = engineMax;
        }
        if (ScaleSelector === ScalingSelect.ADDLEVEL) {
            max += level;

        } else if (ScaleSelector === ScalingSelect.MULLEVEL) {
            max *= level;

        } else if (ScaleSelector === ScalingSelect.MULLEVELWITHCONSTANT) {
            max = max + (level * MultiplyConstant);

        } else if (ScaleSelector === ScalingSelect.INCREASEEVERYXLEVEL) {
            max = max + Math.floor(level / EveryLevelConstant);
        }
        //root.log("newMax: " + max + " engineMax: " + engineMax + "Param: " + this.getSignal());
        return max;

    }

    var NL_ScalingMaxParameters02 = ClassChangeItemUse._resetLevel;
    ClassChangeItemUse._resetLevel = function (itemTargetInfo) {
        var unit = itemTargetInfo.unit;

        // Save the current level before setting the unit level to 1.
        unit.custom.savedClassChangeLevel += unit.getLv();

        NL_ScalingMaxParameters02.call(this, itemTargetInfo);
    };






})();
