/**
 * Plugin to add a custom Skill to make the engines Ignore def on weapon/Skill
 * use half the defense instead.
 * To use give a Unit the custom Skill with the Keyword 'Half-Defense'
 * 
 * Plugin by Nelow/Lyn
 * */

(function () {

    var NL_HalfDefSkill01 = DamageCalculator.calculateDefense;

	DamageCalculator.calculateDefense = function (active, passive, weapon, isCritical, totalStatus, trueHitValue) {
		var def = NL_HalfDefSkill01.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
		if (def === 0) {
			if (SkillControl.getPossessionCustomSkill(passive, 'Half-Defense')) {
				if (Miscellaneous.isPhysicsBattle(weapon)) {
					// Physical attack or Bow attack.
					def = RealBonus.getDef(passive);
				}
				else {
					// Magic attack
					def = RealBonus.getMdf(passive);
				}

				def += CompatibleCalculator.getDefense(passive, active, ItemControl.getEquippedWeapon(passive)) + SupportCalculator.getDefense(totalStatus);
				def = Math.floor(def / 2);
				return def;
			} 
		} 
		return def;
    }

})();
