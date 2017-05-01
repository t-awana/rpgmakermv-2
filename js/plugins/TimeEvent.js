//=============================================================================
// TimeEvent.js
// MIT License (C) 2017 くらむぼん
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// 2017/05/01 ロード後にゲームが再開できない場合があるバグを修正
//=============================================================================

/*:
 * @plugindesc 時間の経過に応じてイベントを起こします。
 * @author くらむぼん
 *
 * @help
 * リアルタイムの時間経過によるイベントを起こすプラグインです。
 * 下に示すプラグインコマンドで予め時間イベントを設定すると、
 * その後経過した時間に応じてイベントが発生します。
 * この時間はセーブしてゲームを終了した後も経過していき、
 * ロード後に時間を越えていた場合はロード直後にイベントが発生します。
 * 
 * 
 * プラグインコマンド：
 * ■on 時間(分)が経ったら確率でスイッチをオンする
 * TimeEvent on 時間(分) 確率(％) ONにするスイッチ番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 例）TimeEvent on 5 60 3 \S[7] \V[2]>60
 * 5分経ったら60%の確率で「S[0003]:三毛ネコ」スイッチをONする
 * （ただし、S[0007]:赤いボールがONでV[0002]:餌が60より上のとき）
 * 
 * ■off 経過時間がきたら確率でスイッチをオフする
 * TimeEvent off 時間(分) 確率(％) OFFにするスイッチ番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 
 * ■get 経過時間がきたら確率でアイテムを１つ得る
 * TimeEvent get 時間(分) 確率(％) 手に入れるアイテム番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 
 * ■join 経過時間がきたら確率でキャラがパーティに加わる
 * TimeEvent join 時間(分) 確率(％) 加わるアクター番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 
 * ■byebye 経過時間がきたら確率でキャラがパーティが別れる
 * TimeEvent byebye 時間(分) 確率(％) 別れるアクター番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 
 * ■common 経過時間がきたら確率でコモンイベントを実行する
 * TimeEvent common 時間(分) 確率(％) 実行するコモンイベント番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 
 * ■add 経過時間がきたら確率で変数を足す
 * TimeEvent add 時間(分) 確率(％) 変数番号 加算値or加算変数番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 変数番号に加算値または加算変数番号を足す（マイナスの場合は引く）
 * 
 * ■addevery 経過時間ごとに確率で変数を足す
 * TimeEvent addevery 時間(分) 確率(％) 変数番号 加算値or加算変数番号 ifスイッチ番号(省略可) if変数条件(省略可)
 * 変数番号に加算値または加算変数番号を足す（マイナスの場合は引く）
 * 
 * ■reset ゲームを開始したときに全ての変数をゼロにする
 * TimeEvent reset 変数番号 変数番号 変数番号
 * 
 * ■alloff ゲームを開始したときに全てのスイッチをＯＦＦにする
 * TimeEvent alloff スイッチ番号 スイッチ番号 スイッチ番号
 * 
 * 
 * ライセンス：
 * このプラグインを利用する時は、作者名をプラグインから削除しないでください。
 * それ以外の制限はありません。お好きなようにどうぞ。
 */

(function() {
	'use strict';
	function toNumber(string) {
		return +string.replace(/\\V\[(\d+)\]/gi, function() {
			return $gameVariables.value(parseInt(arguments[1]));
		});
	}

	function canHappen(timeEvent) {
		var condition = timeEvent.condition.replace(/\\S\[(\d+)\]/gi, function() {
			return $gameSwitches.value(parseInt(arguments[1]));
		}).replace(/\\V\[(\d+)\]/gi, function() {
			return $gameVariables.value(parseInt(arguments[1]));
		});
		var condition2 = timeEvent.condition2.replace(/\\V\[(\d+)\]/gi, function() {
			return $gameVariables.value(parseInt(arguments[1]));
		});
		return Math.random() < timeEvent.rate && eval(condition) && eval(condition2);
	}

	Game_System.prototype.addTimeEvent = function(args) {
		this._timeEvents = (this._timeEvents || []).filter(function(timeEvent) {return !!timeEvent;});
		var command = args[0].toLowerCase();
		var timeEvent = {command: command, minutes: +args[1], rate: args[2] / 100, target: args[3]};
		switch (command) {
			case 'add':
			case 'addevery':
				timeEvent.plusMinutes = timeEvent.minutes;
				timeEvent.increase = args[4];
				timeEvent.condition = args[5] || 'true';
				timeEvent.condition2 = args[6] || 'true';
				break;
			case 'reset':
			case 'alloff':
				args.shift();
				timeEvent = {command: command, list: args};
				break;
			default:
				timeEvent.condition = args[4] || 'true';
				timeEvent.condition2 = args[5] || 'true';
				break;
		}
		timeEvent.time = Date.now();
		this._timeEvents.push(timeEvent);
	};

	Game_System.prototype.executeTimeEvents = function() {
		if (this._timeEvents) this._timeEvents.forEach(function(timeEvent, index, timeEvents) {
			if (!(timeEvent && timeEvent.time + timeEvent.minutes * 60 * 1000 < Date.now())) return;
			var target = toNumber(timeEvent.target);
			if (canHappen(timeEvent)) switch (timeEvent.command) {
				case 'on':
					$gameSwitches.setValue(target, true);
					break;
				case 'off':
					$gameSwitches.setValue(target, false);
					break;
				case 'get':
					$gameParty.gainItem($dataItems[target], 1);
					break;
				case 'join':
					$gameParty.addActor(target);
					break;
				case 'byebye':
					$gameParty.removeActor(target);
					break;
				case 'common':
					$gameTemp.reserveCommonEvent(target);
					break;
				case 'add':
				case 'addevery':
					$gameVariables.setValue(target, $gameVariables.value(target) + toNumber(timeEvent.increase));
					break;
				default:
					break;
			}
			if (timeEvent.command === 'addevery') timeEvent.minutes += timeEvent.plusMinutes;
			else delete timeEvents[index];
		});
	};

	var _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
	Game_System.prototype.onAfterLoad = function() {
		_Game_System_onAfterLoad.apply(this, arguments);
		if (this._timeEvents) this._timeEvents.forEach(function(timeEvent, index, timeEvents) {
			if (timeEvent && timeEvent.command === 'reset') {
				timeEvent.list.forEach(function(variableId) {
					$gameVariables.setValue(variableId, 0);
				});
				delete timeEvents[index];
			}
			if (timeEvent && timeEvent.command === 'alloff') {
				timeEvent.list.forEach(function(switchId) {
					$gameSwitches.setValue(switchId, false);
				});
				delete timeEvents[index];
			}
		});
	};

	var _Scene_Map_update = Scene_Map.prototype.update;
	Scene_Map.prototype.update = function() {
		$gameSystem.executeTimeEvents();
		_Scene_Map_update.apply(this, arguments);
	};

	var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
		_Game_Interpreter_pluginCommand.apply(this, arguments);
		if (command.toLowerCase() === 'timeevent') {
			$gameSystem.addTimeEvent(args);
		}
	};
})();