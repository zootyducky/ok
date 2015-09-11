/*
 * @(#)/heya.client.js  0.9, 2015-06-26
 * 
 * Heya의 admin client (Front end) 환경을 위한 JavaScript
 *
 * @author  Hyuk Jun Kim
 * @version 0.9, 2015-06-26
 */
var heya = heya || {};
var fver = "v1_0";

heya.data = heya.data || {
    dataset: function(reqUrl, voParam, callback) {
        var me = this;
        var dataset = {};
        var $loading = heya.data.loading();
        $loading.modal({ keyboard: false });

        $.ajax({
            type: "POST"
            , url: reqUrl
            //, data: JSON.stringify(voParam)
            , data: voParam
            , dataType: "json"
            , success: function (result) {
                try {
                    dataset = result;
                } catch (exception) {
                    me.execCallback(exception, null);
                }
            }
            , error: function (xhr, txt, err) {
                me.execCallback(err, null);
            }
            , complete: function (xhr, err) {
                if ($loading) $loading.modal('hide');
                me.execCallback(err, dataset);
            }
        });

        this.execCallback = function (err, dataset) {
            callback(err, dataset);
        };
    }
    , loading: function() {
        return $('<div class="modal fade" id="loadingModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">\
            <div class="modal-dialog" role="document">\
                <div class="modal-content">\
                    <div class="modal-header">\
                        <h2 class="modal-title">Loading...</h4>\
                    </div>\
                    <div class="modal-body">\
                        <div class="progress">\
                            <div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">\
                                <span class="sr-only"></span>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>');
    }
};

heya.util = heya.util || {
    downloadCSV: function (objArray, strFileName) {
        var csvSelf = this;
        csvSelf.download = function (strData, strFileName) {
            var D = document,
                A = arguments,
                a = D.createElement("a"),
                d = A[0],
                n = A[1],
                t = A[2] || "text/plain";

            //build download link:
            a.href = "data:text/csv;charset=utf-8," + escape(strData);

            if (window.MSBlobBuilder) { // IE10
                var bb = new MSBlobBuilder();
                bb.append(strData);
                return navigator.msSaveBlob(bb, strFileName);
            }

            if ('download' in a) { //FF20, CH19
                a.setAttribute("download", n);
                a.innerHTML = "downloading...";
                D.body.appendChild(a);
                setTimeout(function () {
                    var e = D.createEvent("MouseEvents");
                    e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    a.dispatchEvent(e);
                    D.body.removeChild(a);
                }, 66);
                return true;
            }

            //do iframe dataURL download: (older W3)
            var f = D.createElement("iframe");
            D.body.appendChild(f);
            f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
            setTimeout(function () {
                D.body.removeChild(f);
            }, 333);
            return true;
        };

        csvSelf.convert = function (array) {
            var str = '';
            var line = '';
            var head = array[0];

            for (var index in array[0]) {
                line += index + ',';
            }

            line = line.slice(0, -1);
            str += line + '\r\n';

            for (var j = 0; j < array.length; j++) {
                var line = '';

                for (var index in array[j]) {
                    line += array[j][index] + ',';
                }

                line.slice(0, line.Length - 1);

                str += line + '\r\n';
            }
            return str;
        }

        var result = '';

        for (var i = 0; i < objArray.length; i++) {
            if (objArray[i].length) {
                result += csvSelf.convert(objArray[i]) + '\r\n\r\n';
            } else {
                var arr = [];
                arr.push(objArray[i]);
                result += csvSelf.convert(arr) + '\r\n\r\n';
            }
        }
        csvSelf.download(result, strFileName);
    }

    , getCookie: function (c_name) {
        var c_value = document.cookie;
        var c_start = c_value.indexOf(" " + c_name + "=");
        if (c_start == -1) {
            c_start = c_value.indexOf(c_name + "=");
        }
        if (c_start == -1) {
            c_value = null;
        } else {
            c_start = c_value.indexOf("=", c_start) + 1;
            var c_end = c_value.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = c_value.length;
            }
            //c_value = unescape(c_value.substring(c_start,c_end));
            c_value = c_value.substring(c_start, c_end);
        }
        return c_value;
    }

    // Alert 기능
    , notification: function (message, alertCallback, cancelCallback) {
        if (confirm(message)) {
            alertCallback();
        } else {
            cancelCallback();
        }
    }

    // 금액 표시 변환 
    , numberFormat: function (num) {
        var pCurrency = /(\d+)(\d{3})/;

        num = num.toString();
        while (pCurrency.test(num)) {
            num = num.replace(pCurrency, "$1,$2");
        }
        return num;
    }

    // 팝업을 연다
    , popup: function (url, callback) {
        //var popup = window.open(url, "", 'scrollbars=no,toolbar=no,resizable=no,width=580,height=650,left=0,top=0');
        var popup = window.open(url, "", 'toolbar=no,width=580,height=650,left=0,top=0');

        if (!callback) {
            callback = function () {
                location.reload();
            }
        }

        $(popup).unload(function () {
            if (this.location == "about:blank") {
                $(popup).unload(callback);
            } else {
                callback();
            }
        });
    }

    /**
     * URL에서 application/x-www-form-urlencoded 형태의 문자열 정보를 추출해서 JSON 객체로 가져온다.
     * @return {Object} application/x-www-form-urlencoded 형태의 문자열 정보를 담은 객체.
     */
    , queryString: function() {
        var url           = document.location.href;
        var urlQueryIndex = url.indexOf("?");
        var urlData       = null;

        if (urlQueryIndex > 0) {
            urlData = url.substring(urlQueryIndex + 1);
        }

        if (urlData == null || urlData == "") {
            return null;
        }

        var paramObj  = {};
        var keyValues = urlData.split("&");

        for (var i = 0; i < keyValues.length; i++) {
            var keyValue = keyValues[i].split("=");
            var key   = unescape(keyValue[0]);
            var value = unescape(keyValue[1]);

            if (paramObj[key]) {
                if (Object.prototype.toString.call(paramObj[key]) == "[object String]")  paramObj[key] = [paramObj[key]];
                paramObj[key].push(value);
            } else {
                paramObj[key] = value;
            }
        }
        return paramObj;
    }

    , randomText: function() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 6; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    , removeCookies: function (cookies) {
        $.each(cookies, function(idx, val) {
            heya.util.setCookie(val, '', -1);
        });

        location.reload();
    }
    
    , setCookie: function (cName, cValue, cDay) {
        var expire = new Date();
        expire.setDate(expire.getDate() + cDay);
        cookies = cName + '=' + escape(cValue) + '; path=/ ';
        if (typeof cDay != 'undefined') cookies += ';expires=' + expire.toGMTString() + ';';
        document.cookie = cookies;
    }

    // 숫자 입력 검사 이벤트
    , numberValidate: function (evt) {
        var keyevent = evt || window.event;
        var key = keyevent.keyCode || keyevent.which;
        key = String.fromCharCode(key);
        //var regex = /[0-9]|\./;
        var regex = /[0-9]/;
        if (!regex.test(key)) {
            keyevent.returnValue = false;
            if (keyevent.preventDefault) keyevent.preventDefault();
        }
    }
};

heya.util.date = heya.util.date || {
    pad: function (value) {
        if (value < 10) {
            return "0" + value;
        } else {
            return String(value);
        }
    }

    , millipad: function (value) {
        if (value < 10) {
            return "00" + value;
        } else if (value < 100) {
            return "0" + value;
        } else {
            return String(value);
        }
    }

    /**
     * 날짜 객체를 yyyy-MM-dd 형태의 문자열로 변경한다.
     * @param  {Date} date  yyyy-MM-dd 형태의 문자열로 변경하고자 하는 날짜 객체.
     * @return {String} yyyy-MM-dd 형태의 문자열.
     */
    , formatDate: function (date) {
        date = date || new Date();

        return date.getFullYear() + "-" + this.pad(date.getMonth() + 1) + "-" + this.pad(date.getDate());
    }

    /**
     * 날짜 객체를 HH:mm:ss.ms 형태의 문자열로 변경한다.
     * @param  {Date} date  HH:mm:ss.ms 형태의 문자열로 변경하고자 하는 날짜 객체.
     * @return {String} HH:mm:ss.ms 형태의 문자열.
     */
    , formatTime: function (date) {
        date = date || new Date();

        return this.pad(date.getHours()) + ":" + this.pad(date.getMinutes()) + ":" + this.pad(date.getSeconds()) + "." + this.millipad(date.getMilliseconds());
    }

    /**
     * 날짜 객체를 yyyy-MM-dd HH:mm:ss.ms 형태의 문자열로 변경한다.
     * @param  {Date} date  yyyy-MM-dd HH:mm:ss.ms 형태의 문자열로 변경하고자 하는 날짜 객체.
     * @return {String} yyyy-MM-dd HH:mm:ss.ms 형태의 문자열.
     */
    , formatDateTime: function (date, millisec) {
        date = date || new Date();

        return date.getFullYear() + "-" + this.pad(date.getMonth() + 1) + "-" + this.pad(date.getDate()) + " " + this.pad(date.getHours()) + ":" + this.pad(date.getMinutes()) + ":" + this.pad(date.getSeconds()) + (millisec ? "." + this.millipad(date.getMilliseconds()) : "");
    }

    /**
     * 날짜 객체를 UTC 기준의 yyyy-MM-dd HH:mm:ss.ms 형태의 문자열로 변경한다.
     * @param  {Date} date  UTC 기준의 yyyy-MM-dd HH:mm:ss.ms 형태의 문자열로 변경하고자 하는 날짜 객체.
     * @return {String}  UTC 기준의 yyyy-MM-dd HH:mm:ss.ms 형태의 문자열.
     */
    , formatUTCDateTime: function (date) {
        date = date || new Date();

        return date.getUTCFullYear() + "-" + this.pad(date.getUTCMonth() + 1) + "-" + this.pad(date.getUTCDate()) + " " + this.pad(date.getUTCHours()) + ":" + this.pad(date.getUTCMinutes()) + ":" + this.pad(date.getUTCSeconds()) + "." + this.millipad(date.getUTCMilliseconds());
    }

    /**
     * yyyy-MM-dd 형태의 문자열을 날짜 객체로 변경한다.
     * @param  {String} isoText  yyyy-MM-dd 혹은 yyyy-MM-dd HH:mm:ss.ms 형태의 문자열.
     * @return {Date} 날짜 객체.
     */
    , parseDate: function (isoText) {
        if (isoText == null) {
            return new Date();
        } else {
            var separatedText = isoText.split(" ");

            if (!separatedText[1]) {
                separatedText[1] = '00:00:00.000';
            }

            var separatedDates = separatedText[0].split("-");
            var separatedTimes = separatedText[1].split(":");

            separatedTimes[2] = separatedTimes[2].split(".")[0];
            var separatedMillisec = (separatedText[1].split(".")[1]) ? separatedText[1].split(".")[1] : '000';

            if (separatedText) {
                return new Date(parseInt(separatedDates[0], 10), parseInt(separatedDates[1], 10) - 1, parseInt(separatedDates[2], 10), parseInt(separatedTimes[0], 10), parseInt(separatedTimes[1], 10), parseInt(separatedTimes[2], 10), parseInt(separatedMillisec, 10));
            } else {
                return new Date();
            }
        }
    }

    /**
     * 두 시간의 차를 시간으로 나타낸다.
     * @param  {String} indate1  yyyy-MM-dd HH:mm:ss.ms 포맷의 첫번째 시간
     * @param  {String} indate2  yyyy-MM-dd HH:mm:ss.ms 포맷의 두번째 시간
     * @return {Number} 두 시간간의 차를 나타내는 시간(HH).
     */
    , getDiffHours: function (indate1, indate2) {
        var time1 = this.parseDate(indate1).getTime();
        var time2 = this.parseDate(indate2).getTime();

        return Math.round((time2 - time1) / 1000 / 60 / 60);
    }

    /**
     * 시간의 차를 텍스트로 나타낸다.
     * @param  {Date} indate1  비교하고자 하는 첫번째 날짜 객체
     * @param  {Date} indate2  비교하고자 하는 두번째 날짜 객체
     * @return {String} 두 시간간의 차를 나타내는 텍스트.
     */
    , getTimeDiffText: function (indate1, indate2) {
        var diff = (indate1.getTime() < indate2.getTime()) ? indate2.getTime() - indate1.getTime() : indate1.getTime() - indate2.getTime();

        if (diff / 1000 < 60) return Math.round(diff / 1000).toString() + ' 초';
        else if (diff / 1000 / 60 < 60) return Math.round(diff / 1000 / 60).toString() + ' 분';
        else if (diff / 1000 / 60 / 60 < 24) return Math.round(diff / 1000 / 60 / 60).toString() + ' 시간';
        else if (diff / 1000 / 60 / 60 / 24 < 7) return Math.round(diff / 1000 / 60 / 60 / 24).toString() + ' 일';
        else if (diff / 1000 / 60 / 60 / 24 / 7 < 4) return Math.round(diff / 1000 / 60 / 60 / 24 / 7).toString() + ' 주';
        else if (diff / 1000 / 60 / 60 / 24 / 7 / 4 < 12) return Math.round(diff / 1000 / 60 / 60 / 24 / 7 / 4).toString() + ' 개월';
        else return '오래된 항목';
    }
};