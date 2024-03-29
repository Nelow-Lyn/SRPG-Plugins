
// Plugin inspired by Goinza's unitcommand-skills plugin
// made by Nelow-Lyn
// If a Unit attacks with a weapon with the custom parameter
// { shoveAfterAttack : 1}
// the target unit will be shoved away by a square
// if a Unit attacks with ha weapon with the custom parameter
// {pullAfterAttack : 1}
// the target unit will be pulled towards the unit
// Works for both Players and Enemies/Allies now!


(function () {
    var NL_ShoveAfterBattle01 = PreAttack._pushFlowEntriesEnd;
    PreAttack._pushFlowEntriesEnd = function (straightFlow) {
        NL_ShoveAfterBattle01.call(this,straightFlow);
        straightFlow.pushFlowEntry(shoveOrPullFlowEntry);
    }

    var shoveOrPullFlowEntry = defineObject(BaseFlowEntry,
        {
            enterFlowEntry: function (preAttack) {
                //this._prepareMemberData(preAttack);
                return this._completeMemberData(preAttack);
            },

            getDirection: function (x, y, targetX, targetY) {
                var dir;
                var absX = Math.abs(x - targetX);	
                var absY = Math.abs(y - targetY);	

                if (absY >= absX) {
                    if (y > targetY) {
                        dir = DirectionType.TOP;
                    }
                    else {
                        dir = DirectionType.BOTTOM;
                    }
                }
                else {
                    if (x > targetX) {
                        dir = DirectionType.LEFT;
                    }
                    else {
                        dir = DirectionType.RIGHT;
                    }
                }

                return dir;
            },
            _completeMemberData: function (preAttack) {
                var attackobject = preAttack.getCoreAttack().getAttackFlow().getAttackOrder()
                var unit = preAttack.getAttackParam().unit
                var targetUnit = preAttack.getAttackParam().targetUnit
                var weapon = BattlerChecker.getBaseWeapon(unit);
                if (unit.getHp() === 0 || targetUnit.getHp() === 0) {
                    return EnterResult.NOTENTER;
                }
                if (weapon.custom.shoveAfterAttack === 1 && this.checkhit(attackobject)) {
                    this.shove(unit, targetUnit);
                    return EnterResult.OK;
                } else if (weapon.custom.pullAfterAttack === 1 && this.checkhit(attackobject)) {
                    this.pull(unit, targetUnit);
                    return EnterResult.OK;
                }
                return EnterResult.NOTENTER;
            },
            shove: function (unit, targetUnit) {
                var direction = this.getDirection(unit.getMapX(), unit.getMapY(), targetUnit.getMapX(), targetUnit.getMapY());
                var dynamicEvent = createObject(DynamicEvent);
                var generator = dynamicEvent.acquireEventGenerator();
                if (this.checkmove(unit, targetUnit)) {
                    generator.unitSlide(targetUnit, direction, 3, SlideType.START, false);
                    generator.unitSlide(targetUnit, 0, 0, SlideType.UPDATEEND, false);
                    dynamicEvent.executeDynamicEvent();
                }
            },
            pull: function (unit, targetUnit) {
                var direction = this.getDirection(targetUnit.getMapX(), targetUnit.getMapY(), unit.getMapX(), unit.getMapY());
                var dynamicEvent = createObject(DynamicEvent);
                var generator = dynamicEvent.acquireEventGenerator();
                if (this.checkmove(unit, targetUnit)) {
                    generator.unitSlide(targetUnit, direction, 3, SlideType.START, false);
                    generator.unitSlide(targetUnit, 0, 0, SlideType.UPDATEEND, false);
                    dynamicEvent.executeDynamicEvent();
                }
            },

            checkmove: function(unit, targetUnit) {
                var deltaX, deltaY; //Distance between the units
                var boundaryX, boundaryY; //Boundary of the map
                var targetX, targetY; //Position where the targetUnit would get if pushed
                var targetTerrain; //The tile where the targetUnit would get if pushed
                var tileOccupied;
                var movable = false;

                //This makes it so the targetUnit moves a tile away from the unit
                //Because both units are adjacent, one of the deltas must be zero, while the other must be one
                deltaX = targetUnit.getMapX() - unit.getMapX();
                deltaY = targetUnit.getMapY() - unit.getMapY();

                boundaryX = root.getCurrentSession().getCurrentMapInfo().getMapWidth();
                boundaryY = root.getCurrentSession().getCurrentMapInfo().getMapHeight();

                targetX = targetUnit.getMapX() + deltaX;
                targetY = targetUnit.getMapY() + deltaY;

                //Checks so the unit does not move beyond the limits of the map
                if (targetX < boundaryX && targetX >= 0 && targetY < boundaryY && targetY >= 0) {
                    targetTerrain = root.getCurrentSession().getTerrainFromPos(targetX, targetY, true); //I do not know the impact of the boolean on this function
                    tileOccupied = (root.getCurrentSession().getUnitFromPos(targetX, targetY) != null) //True if there is a unit in the targetTerrain
                    if (targetTerrain.getMovePoint(targetUnit) > 0 && !tileOccupied) {
                        movable = true;
                    }
                }
                return movable;
            },
            checkhit: function(attackObject) {

                var attackCount = attackObject.getEntryCount();
                var i, unit, isHit;
                attackObject.setCurrentIndex(0);
                for(i = 0; i<attackCount; i++) {
                    isHit = attackObject.isCurrentHit();
                     unit = attackObject.getActiveUnit().getUnitType();
                     if (isHit && unit === 0) {
                     return true;
                     }
                    attackObject.nextOrder();
                }
                return false;
             }  
        }
    );
})();