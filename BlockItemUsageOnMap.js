/**
 * Plugin to block Item usage on the map
 * Items with a custom parameter of {blockItemUsage:true}
 * can't be used on the map.
 * 
 * Plugin by Nelow/Lyn
 * */
 
(function () {

    var NL_BlockItemUsage01 = ItemControl.isItemUsable;

    ItemControl.isItemUsable = function (unit, item) {
        var result = NL_BlockItemUsage01.call(this, unit, item);
        var scene = root.getCurrentScene();
        if (item.custom.blockItemUsage != null && item.custom.blockItemUsage === true && scene === SceneType.FREE) {
            return false;
        } else {
            return result;
        }
    }
})();
