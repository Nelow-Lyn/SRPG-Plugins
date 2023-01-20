/**
 * Simple Plugin which allows states to tick while a unit is captured
 * requires no setup
 * It does overwrite the two Methods 
 * RecoveryAllFlowEntry._completeMemberData
 * StateTurnFlowEntry._getPlayerList
 */


RecoveryAllFlowEntry._completeMemberData = function (turnChange) {
	var i, unit, recoveryValue;
	var commandCount = 0;
	var isSkipMode = CurrentMap.isTurnSkipMode();
	var generator = this._dynamicEvent.acquireEventGenerator();
	var turnType = root.getCurrentSession().getTurnType();
	//gets the defaultSortielist instead of the actor list, since Captured units are not included in that list
	if (turnType === TurnType.PLAYER) {
		var list = PlayerList.getSortieDefaultList();
	} else if (turnType === TurnType.ENEMY) {
		var list = EnemyList.getAliveDefaultList();
	} else if (turnType === TurnType.ALLY) {
		var list = AllyList.getAliveDefaultList();
	}
	var count = list.getCount();
	for (i = 0; i < count; i++) {
		unit = list.getData(i);
		root.log(unit.getName());
		recoveryValue = this._getRecoveryValue(unit);
		root.log(recoveryValue);
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
};

StateTurnFlowEntry._getPlayerList = function () {
	return PlayerList.getSortieDefaultList();
}
