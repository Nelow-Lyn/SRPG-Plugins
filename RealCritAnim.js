/**
 * This plugin changes how the real critical animation of a mage is played.
 * Instead of playing the real critical on hit
 * it will now play the animation as its own thing
 * This should allow for better options to display
 * critical animations.
 *
 **/
UIBattleLayout._showDamageAnime = function (battler, isCritical, isFinish) {
	var pos, effect, isRight;
	var anime = null;
	var isNoDamage = this._realBattle.getAttackOrder().getPassiveDamage() === 0;
	var offsetPos = EnemyOffsetControl.getOffsetPos(battler);
	var attackType = BattlerChecker.findAttackTemplateTypeFromUnit(this._realBattle._order.getActiveUnit())

	if (root.getAnimePreference().isEffectDefaultStyle()) {
		isRight = this._realBattle.getActiveBattler() === this._realBattle.getBattler(true);
	}
	else {
		isRight = this._realBattle.getPassiveBattler() === this._realBattle.getBattler(true);
	}
	//Check for Type of the attack, if its magic dont play crit animation again
	if (!(attackType === AttackTemplateType.MAGE)) {
		anime = WeaponEffectControl.getDamageAnime(this._realBattle.getActiveBattler().getUnit(), isCritical, true);
	}
	

	if (anime !== null) {
		pos = battler.getEffectPos(anime);
		effect = this._realBattle.createEffect(anime, pos.x + offsetPos.x, pos.y + offsetPos.y, isRight, false);
		effect.setAsync(this._isDamageEffectAsync());
		effect.enableSpriteScaling(this._isDamageEffectScaling());
	}

	if (isNoDamage) {
		anime = root.queryAnime('realnodamage');
	}
	else if (isCritical) {
		anime = root.queryAnime('realcriticalhit');
	}
	else {
		anime = null;
	}

	if (anime !== null) {
		pos = battler.getEffectPos(anime);
		effect = this._realBattle.createEffect(anime, pos.x + offsetPos.x, pos.y + offsetPos.y + this._getTextAnimeOffsetY(), isRight, false);
		effect.setAsync(false);
		effect.enableSpriteScaling(this._isDamageEffectScaling());
	}

	if (!isNoDamage && this._isDamagePopupDisplayable()) {
		this._showDamagePopup(battler, this._realBattle.getAttackOrder().getPassiveFullDamage(), isCritical);
	}

};

MagicBattler._getMagicAnime = function () {
	var isCritical = this._realBattle._order.isCurrentCritical();
	var weapon = BattlerChecker.getRealBattleWeapon(this._realBattle.getActiveBattler().getUnit());
	if (isCritical) {
		return WeaponEffectControl.getAnime(this._unit, WeaponEffectAnime.REALCRITICAL);
	} else {
		return weapon.getMagicAnime();
	}
}