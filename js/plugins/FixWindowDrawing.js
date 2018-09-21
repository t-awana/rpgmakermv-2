//=============================================================================
// FixWindowDrawing.js
// PUBLIC DOMAIN
//=============================================================================

/*:
 * @plugindesc ウィンドウ表示が稀におかしくなるバグを修正します。
 * @author くらむぼん
 *
 * @help
 * 最新のWindows版Chromeで、メニュー画面を素早く繰り返し切り替えると
 * 稀にウィンドウ表示がおかしくなって中身が空になったり、
 * 背景色が透明になったりするバグがあるため、それを修正します。
 * 
 * ライセンス：
 * このプラグインの利用法に制限はありません。お好きなようにどうぞ。
 */

(function() {
    'use strict';
    Bitmap.prototype.checkDirty = function() {
        if (this._dirty) {
            var baseTexture = this._baseTexture;
            setTimeout(function() {
                baseTexture.update();
            }, 0);
            this._dirty = false;
        }
    };
})();