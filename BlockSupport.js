/* Plugin by Nelow/Lyn
   Allows a Weapon to bypass the Defense gained by Support
   To enable it, give a Weapon the custom Parameter {blockSupport: 1}
 */
(function() {
var NL_BlockSupport01 = DamageCalculator.calculateDefense;

DamageCalculator.calculateDefense = function (active, passive, weapon, isCritical, totalStatus, trueHitValue) {
    var def;
	if (weapon.custom.blockSupport === 1) {
		if (this.isNoGuard(active, passive, weapon, isCritical, trueHitValue)) {
			return 0;
		}

		if (Miscellaneous.isPhysicsBattle(weapon)) {
			// Physical attack or Bow attack.
			def = RealBonus.getDef(passive);
		}
		else {
			// Magic attack
			def = RealBonus.getMdf(passive);
		}

		def += CompatibleCalculator.getDefense(passive, active, ItemControl.getEquippedWeapon(passive));

		return def;
	}
	else {
		return NL_BlockSupport01.call(this, active, passive, weapon, isCritical, totalStatus, trueHitValue);
    }

    
};
})();