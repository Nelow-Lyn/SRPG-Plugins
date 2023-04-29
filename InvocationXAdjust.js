/**
 * Plugin to adjust the position of the Magic Invocation effect
 * to use give either the weapon or the class a custom parameter called
 * 
 * {invocationAdjust: 50}
 * 
 * the number is pixels in the x direction away from the character.
 * 50 is default, 0 will be directly on the Character
 * 
 * Plugin by Nelow/Lyn
 * 
 * */


MagicBattler._createInvocationEffect = function () {

	var isRight, dx, pos;
	var anime = this._getInvocationAnime();
	var weapon = BattlerChecker.getRealBattleWeapon(this._unit);
	var cls = BattlerChecker.getRealBattleClass(this._unit, weapon);
	var clsAnime = cls.getClassAnime(weapon.getWeaponCategoryType());

	if (anime === null || clsAnime.isInvocationDisabled(this._motion.getMotionId())) {
		return;
	}

	isRight = this === this._realBattle.getBattler(true);
	dx = 50;
	pos = this.getEffectPos(anime);
	if (weapon.custom.invocationAdjust != null) {
		dx = weapon.custom.invocationAdjust;
	} else if (cls.custom.invocationAdjust != null) {
		dx = cls.custom.invocationAdjust;
	}

	if (isRight) {
		dx *= -1;
	}

	// RealBattle calls move of this._magicEffect or _invocationEffect.
	this._invocationEffect = this._realBattle.createEffect(anime, pos.x + dx, pos.y + 10, isRight, false);


}