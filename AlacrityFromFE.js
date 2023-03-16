/**
 * Plugin to make a custom skill like Alacrity in FE
 * Make a custom skill with the keyword Alacrity
 * give it a custom parameter {speedDifference:5}
 * this is the required speed difference for the
 * skill to happen. 
 * 
 * This plugin doesnt allow the skill to show in battle
 * 
 * */



NormalAttackOrderBuilder._startVirtualAttack = function () {
	var i, j, isFinal, attackCount, src, dest;
	var virtualActive, virtualPassive, isDefaultPriority;
	var unitSrc = this._attackInfo.unitSrc;
	var unitDest = this._attackInfo.unitDest;

	src = VirtualAttackControl.createVirtualAttackUnit(unitSrc, unitDest, true, this._attackInfo);
	dest = VirtualAttackControl.createVirtualAttackUnit(unitDest, unitSrc, false, this._attackInfo);

	src.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitSrc, unitDest, src.weapon);
	dest.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitDest, unitSrc, dest.weapon);

	isDefaultPriority = this._isDefaultPriority(src, dest);
	if (isDefaultPriority) {
		src.isInitiative = true;
	}
	else {
		dest.isInitiative = true;
	}

	for (i = 0; ; i++) {
		// Execute if statement and else statement alternately.
		// The order of turns will change with this, for instance, after this side attacked, the opponent attacks.
		if ((i % 2) === 0) {
			if (isDefaultPriority) {
				virtualActive = src;
				virtualPassive = dest;
			}
			else {
				virtualActive = dest;
				virtualPassive = src;
			}
		}
		else {
			if (isDefaultPriority) {
				virtualActive = dest;
				virtualPassive = src;
			}
			else {
				virtualActive = src;
				virtualPassive = dest;
			}
		}

		// Check if the action number left.
		if (VirtualAttackControl.isRound(virtualActive)) {
			VirtualAttackControl.decreaseRoundCount(virtualActive);
			var activeUnit = virtualActive.unitSelf;
			var skill = SkillControl.getPossessionCustomSkill(activeUnit, "Alacrity");
			if (skill !== null) {
				var activespd = RealBonus.getSpd(activeUnit);
				var passivespd = RealBonus.getSpd(virtualPassive.unitSelf);
				var diff = activespd - passivespd;
				if (diff >= skill.custom.speedDifference) {
					i -= 1;
                }
            }
			attackCount = this._getAttackCount(virtualActive, virtualPassive);

			// Loop processing because there is a possibility to attack 2 times in a row.
			for (j = 0; j < attackCount; j++) {
				isFinal = this._setDamage(virtualActive, virtualPassive);
				if (isFinal) {
					// The battle is not continued any longer because the unit has died.
					virtualActive.roundCount = 0;
					virtualPassive.roundCount = 0;
					break;
				}
			}
		}

		if (virtualActive.roundCount === 0 && virtualPassive.roundCount === 0) {
			break;
		}
	}

	this._endVirtualAttack(src, dest);
}
