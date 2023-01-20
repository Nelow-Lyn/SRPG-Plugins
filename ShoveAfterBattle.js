
// Plugin inspired by Goinza's unitcommand-skills plugin
// If a player attacks with a weapon with the custom parameter
// { shoveAfterAttack : 1}
// the target unit will be shoved away by a square
// Overwritten UnitCommand.Attack._moveResult()
// made by Nelow-Lyn

UnitCommand.Attack._moveResult = function () {
    if (this._preAttack.movePreAttackCycle() !== MoveResult.CONTINUE) {
        var weapon = this._weaponSelectMenu.getSelectWeapon();
        var targetUnit = this._posSelector.getSelectorTarget(false);
        var unit = this.getCommandTarget();
        if (weapon.custom.shoveAfterAttack === 1) {
            shove(unit, targetUnit);
        }
        this.endCommandAction();
        return MoveResult.END;

    }
    return MoveResult.CONTINUE;
},


function shove(unit, targetUnit) {
    if (unit === null || targetUnit === null) {
        return;
    }
    var direction = PosChecker.getSideDirection(unit.getMapX(), unit.getMapY(), targetUnit.getMapX(), targetUnit.getMapY());
    var dynamicEvent = createObject(DynamicEvent);
    var generator = dynamicEvent.acquireEventGenerator();
    if (checkmove(unit, targetUnit)) {
        generator.unitSlide(targetUnit, direction, 3, SlideType.START, false);
        generator.unitSlide(targetUnit, 0, 0, SlideType.UPDATEEND, false);
        dynamicEvent.executeDynamicEvent();
    }
}

function checkmove(unit, targetUnit) {
        var deltaX, deltaY; //Distance between the units
        var boundaryX, boundaryY; //Boundary of the map
        var targetX, targetY; //Position where the targetUnit would get if pushed
        var targetTerrain; //The tile where the targetUnit would get if pushed
        var terrainOccupied;
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
}